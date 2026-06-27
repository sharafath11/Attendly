import mongoose from "mongoose";
import { WhatsappQueueModel } from "../models/whatsappQueue.model";

export interface WhatsAppJobData {
  phone: string;
  message: string;
  centerId: string;
  notificationId?: string;
  parentNotificationId?: string;
}

export async function enqueueWhatsAppMessage(
  data: WhatsAppJobData,
  delayMs = 0
): Promise<void> {
  const nextAttemptAt = new Date(Date.now() + delayMs);
  
  await WhatsappQueueModel.create({
    phone: data.phone,
    message: data.message,
    centerId: new mongoose.Types.ObjectId(data.centerId),
    notificationId: data.notificationId ? new mongoose.Types.ObjectId(data.notificationId) : undefined,
    parentNotificationId: data.parentNotificationId ? new mongoose.Types.ObjectId(data.parentNotificationId) : undefined,
    status: "pending",
    attempts: 0,
    nextAttemptAt
  });
}

export async function enqueueBroadcast(
  phones: string[],
  message: string,
  centerId: string,
  baseDelayMs = 0
): Promise<void> {
  const STAGGER_MS_MIN = 5_000;
  const STAGGER_MS_MAX = 8_000;

  const jobs = phones.map((phone, index) => {
    const jitter =
      Math.floor(Math.random() * (STAGGER_MS_MAX - STAGGER_MS_MIN + 1)) +
      STAGGER_MS_MIN;
    const delay = baseDelayMs + index * jitter;

    return {
      phone,
      message,
      centerId: new mongoose.Types.ObjectId(centerId),
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date(Date.now() + delay),
    };
  });

  if (jobs.length > 0) {
    await WhatsappQueueModel.insertMany(jobs);
    console.log(
      `[WAQueue] Queued ${jobs.length} broadcast messages with staggered delays in MongoDB.`
    );
  }
}
