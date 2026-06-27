import { Worker, Job } from "bullmq";
import { sendTextMessage, destroyWAClient } from "./whatsappAuth.service";
import { WA_QUEUE_NAME, WhatsAppJobData } from "./whatsappQueue.service";
import { getRedisConnectionOptions } from "../utils/redis";
import { NotificationModel } from "../models/notification.model";
import { ParentNotificationModel } from "../models/parentNotification.model";
import { mutateMessage } from "../utils/messageMutator";
import mongoose from "mongoose";

// ─── Globals ─────────────────────────────────────────────────────────────────

let _worker: Worker<WhatsAppJobData> | null = null;

// ─── Format phone → WhatsApp JID ─────────────────────────────────────────────

function toJid(phone: string): string {
  // Strip non-digits, prepend "91" if 10-digit Indian number
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `91${digits}` : digits;
  return `${e164}@s.whatsapp.net`;
}

// ─── Job processor ───────────────────────────────────────────────────────────

// ─── Per-tenant failure tracker (in-memory, reset on worker restart) ─────────
const _tenantFailed = new Map<string, number>(); // centerId → epoch of failure
const TENANT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes isolation after failure

function isTenantCoolingDown(centerId: string): boolean {
  const failedAt = _tenantFailed.get(centerId);
  if (!failedAt) return false;
  if (Date.now() - failedAt > TENANT_COOLDOWN_MS) {
    _tenantFailed.delete(centerId); // cooldown expired
    return false;
  }
  return true;
}

async function processJob(job: Job<WhatsAppJobData>): Promise<void> {
  const { phone, message, centerId, notificationId, parentNotificationId } = job.data;

  console.log(
    `[WAWorker] Processing job ${job.id} → phone=${phone} attempt=${job.attemptsMade + 1}`
  );

  // ── (B) Non-blocking tenant isolation ─────────────────────────────────────
  // If this center's WhatsApp has been down recently, fail fast and skip
  // so we do not block other centers' messages in the global queue.
  if (isTenantCoolingDown(centerId)) {
    const err = new Error(
      `[WAWorker] Center ${centerId} is in isolation cooldown — skipping job ${job.id}`
    );
    console.warn(err.message);
    // Persist failure state
    if (notificationId && mongoose.isValidObjectId(notificationId)) {
      await NotificationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(notificationId) },
        { status: "failed", error: "Center WhatsApp offline — retrying later" }
      );
    }
    throw err; // BullMQ will retry with backoff per job options
  }

  const jid = toJid(phone);

  // ── (C) Contextual Token Mutation ─────────────────────────────────────────
  // Dynamically vary message structure to avoid spam-filter fingerprinting
  const mutatedMessage = mutateMessage(message, centerId);

  try {
    await sendTextMessage(centerId, jid, mutatedMessage);
    console.log(`[WAWorker] ✅ Sent to ${jid} for center ${centerId}`);

    // Update notification record if ID is present
    if (notificationId && mongoose.isValidObjectId(notificationId)) {
      await NotificationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(notificationId) },
        { status: "sent" }
      );
    }

    // Update Parent Notification log
    if (parentNotificationId && mongoose.isValidObjectId(parentNotificationId)) {
      await ParentNotificationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(parentNotificationId) },
        { status: "sent" }
      );
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WAWorker] ❌ Failed to send to ${jid}: ${errMsg}`);

    // ── (B) Tenant isolation: flag center as offline on WA-layer failures ─────
    const isWAConnectionError =
      errMsg.includes("Cannot send") ||
      errMsg.includes("connecting") ||
      errMsg.includes("ECONNRESET") ||
      errMsg.includes("Session closed") ||
      errMsg.includes("Target closed");

    if (isWAConnectionError) {
      _tenantFailed.set(centerId, Date.now());
      console.warn(
        `[WAWorker] Center ${centerId} flagged for ${TENANT_COOLDOWN_MS / 60000}m isolation. Other tenants unaffected.`
      );
    }

    // Mark notification as failed on last attempt
    const isLastAttempt =
      job.attemptsMade + 1 >= (job.opts.attempts ?? 3);
    if (notificationId && mongoose.isValidObjectId(notificationId) && isLastAttempt) {
      await NotificationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(notificationId) },
        { status: "failed", error: errMsg }
      );
    }

    if (parentNotificationId && mongoose.isValidObjectId(parentNotificationId) && isLastAttempt) {
      await ParentNotificationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(parentNotificationId) },
        { status: "failed" }
      );
    }

    // Re-throw so BullMQ knows the job failed and can retry with backoff
    throw err;
  }
}

// ─── Public: start the worker (called once at server startup) ─────────────────

export function startWhatsAppWorker(): void {
  if (_worker) {
    console.warn("[WAWorker] Worker already running — skipping duplicate init.");
    return;
  }

  const connection = getRedisConnectionOptions();

  _worker = new Worker<WhatsAppJobData>(WA_QUEUE_NAME, processJob, {
    connection,
    concurrency: 1,          // process one message at a time (anti-ban)
    limiter: {
      max: 1,
      duration: 6_000,       // hard cap: max 1 message per 6 s (anti-ban)
    },
  });

  _worker.on("completed", (job) => {
    console.log(`[WAWorker] Job ${job.id} completed.`);
  });

  _worker.on("failed", (job, err) => {
    console.error(`[WAWorker] Job ${job?.id} failed: ${err.message}`);
  });

  _worker.on("error", (err) => {
    console.error("[WAWorker] Worker error:", err.message);
  });

  console.log("[WAWorker] 🚀 WhatsApp message worker started.");
}

// ─── Public: graceful shutdown ─────────────────────────────────────────────────

export async function stopWhatsAppWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
    console.log("[WAWorker] Worker stopped.");
  }
}
