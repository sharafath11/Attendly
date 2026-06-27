import { sendTextMessage } from "./whatsappAuth.service";
import { NotificationModel } from "../models/notification.model";
import { ParentNotificationModel } from "../models/parentNotification.model";
import { WhatsappQueueModel } from "../models/whatsappQueue.model";
import { mutateMessage } from "../utils/messageMutator";
import mongoose from "mongoose";

let _isRunning = false;
let _pollInterval: NodeJS.Timeout | null = null;
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds for new tasks

function toJid(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `91${digits}` : digits;
  return `${e164}@s.whatsapp.net`;
}

const _tenantFailed = new Map<string, number>();
const TENANT_COOLDOWN_MS = 5 * 60 * 1000;

function isTenantCoolingDown(centerId: string): boolean {
  const failedAt = _tenantFailed.get(centerId);
  if (!failedAt) return false;
  if (Date.now() - failedAt > TENANT_COOLDOWN_MS) {
    _tenantFailed.delete(centerId);
    return false;
  }
  return true;
}

async function processNextJob(): Promise<boolean> {
  const job = await WhatsappQueueModel.findOneAndUpdate(
    {
      status: "pending",
      nextAttemptAt: { $lte: new Date() }
    },
    { $set: { status: "processing" }, $inc: { attempts: 1 } },
    { sort: { nextAttemptAt: 1 }, new: true }
  );

  if (!job) return false;

  const centerIdStr = job.centerId.toString();

  if (isTenantCoolingDown(centerIdStr)) {
    const errMsg = `[WAWorker] Center ${centerIdStr} is in isolation cooldown — skipping job ${job._id}`;
    console.warn(errMsg);
    
    if (job.notificationId) {
      await NotificationModel.updateOne(
        { _id: job.notificationId },
        { status: "failed", error: "Center WhatsApp offline — retrying later" }
      );
    }
    
    // Push attempt time to the future to retry later
    await WhatsappQueueModel.updateOne(
      { _id: job._id },
      { status: "pending", nextAttemptAt: new Date(Date.now() + 60_000) }
    );
    return true; // Still true so we check for other non-blocked jobs
  }

  const jid = toJid(job.phone);
  const mutatedMessage = mutateMessage(job.message, centerIdStr);

  try {
    await sendTextMessage(centerIdStr, jid, mutatedMessage);
    console.log(`[WAWorker] ✅ Sent to ${jid} for center ${centerIdStr}`);

    if (job.notificationId) {
      await NotificationModel.updateOne(
        { _id: job.notificationId },
        { status: "sent" }
      );
    }

    if (job.parentNotificationId) {
      await ParentNotificationModel.updateOne(
        { _id: job.parentNotificationId },
        { status: "sent" }
      );
    }

    // ATOMIC JOB CLEANUP: Hard Delete finished job
    await WhatsappQueueModel.deleteOne({ _id: job._id });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WAWorker] ❌ Failed to send to ${jid}: ${errMsg}`);

    const isWAConnectionError =
      errMsg.includes("Cannot send") ||
      errMsg.includes("connecting") ||
      errMsg.includes("ECONNRESET") ||
      errMsg.includes("Session closed") ||
      errMsg.includes("Target closed");

    if (isWAConnectionError) {
      _tenantFailed.set(centerIdStr, Date.now());
      console.warn(
        `[WAWorker] Center ${centerIdStr} flagged for ${TENANT_COOLDOWN_MS / 60000}m isolation.`
      );
    }

    const isLastAttempt = job.attempts >= 3;

    if (isLastAttempt) {
      if (job.notificationId) {
        await NotificationModel.updateOne(
          { _id: job.notificationId },
          { status: "failed", error: errMsg }
        );
      }
      if (job.parentNotificationId) {
        await ParentNotificationModel.updateOne(
          { _id: job.parentNotificationId },
          { status: "failed" }
        );
      }
      
      await WhatsappQueueModel.updateOne(
        { _id: job._id },
        { status: "failed", error: errMsg }
      );
    } else {
      // Exponential backoff
      const nextDelay = 10_000 * Math.pow(2, job.attempts - 1);
      await WhatsappQueueModel.updateOne(
        { _id: job._id },
        { 
          status: "pending", 
          error: errMsg,
          nextAttemptAt: new Date(Date.now() + nextDelay) 
        }
      );
    }
  }

  // 6-second anti-ban delay explicitly enforced by awaiting
  await new Promise(resolve => setTimeout(resolve, 6000));
  return true;
}

async function runWorkerLoop() {
  if (!_isRunning) return;

  try {
    const hasMore = await processNextJob();
    if (hasMore) {
      setImmediate(runWorkerLoop); // Process next immediately if there was one
    } else {
      _pollInterval = setTimeout(runWorkerLoop, POLL_INTERVAL_MS);
    }
  } catch (err) {
    console.error("[WAWorker] Loop error:", err);
    _pollInterval = setTimeout(runWorkerLoop, POLL_INTERVAL_MS);
  }
}

export function startWhatsAppWorker(): void {
  if (_isRunning) {
    console.warn("[WAWorker] Worker already running.");
    return;
  }
  
  _isRunning = true;
  console.log("[WAWorker] 🚀 MongoDB Polling WhatsApp worker started.");
  runWorkerLoop();
}

export async function stopWhatsAppWorker(): Promise<void> {
  _isRunning = false;
  if (_pollInterval) {
    clearTimeout(_pollInterval);
    _pollInterval = null;
  }
  console.log("[WAWorker] Worker stopped.");
}
