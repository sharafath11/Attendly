import { Queue, QueueOptions } from "bullmq";
import { getRedisConnectionOptions } from "../utils/redis";

// ─── Job payload ─────────────────────────────────────────────────────────────

export interface WhatsAppJobData {
  phone: string;    // E.164 digits without "+", e.g. "919876543210"
  message: string;
  centerId: string;
  notificationId?: string; // optional — for status tracking
  parentNotificationId?: string;
}

// ─── Shared queue name (must match the worker) ───────────────────────────────

export const WA_QUEUE_NAME = "whatsapp-outbound";

// ─── Default job options ──────────────────────────────────────────────────────

const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 10_000, // 10 s → 20 s → 40 s
  },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};

// ─── Singleton queue ─────────────────────────────────────────────────────────

let _queue: Queue<WhatsAppJobData> | null = null;

export function getWAQueue(): Queue<WhatsAppJobData> {
  if (!_queue) {
    const connection = getRedisConnectionOptions();
    const opts: QueueOptions = { connection };
    _queue = new Queue<WhatsAppJobData>(WA_QUEUE_NAME, opts);

    _queue.on("error", (err) => {
      console.error("[WAQueue] Queue error:", err.message);
    });
  }
  return _queue;
}

// ─── Public: enqueue a single message ────────────────────────────────────────

export async function enqueueWhatsAppMessage(
  data: WhatsAppJobData,
  delayMs = 0
): Promise<void> {
  const queue = getWAQueue();
  await queue.add("send-message", data, {
    ...DEFAULT_JOB_OPTS,
    delay: delayMs,
  });
}

// ─── Public: enqueue a batch (broadcast) with staggered delays ───────────────

export async function enqueueBroadcast(
  phones: string[],
  message: string,
  centerId: string,
  baseDelayMs = 0
): Promise<void> {
  const queue = getWAQueue();
  const STAGGER_MS_MIN = 5_000;
  const STAGGER_MS_MAX = 8_000;

  const jobs = phones.map((phone, index) => {
    const jitter =
      Math.floor(Math.random() * (STAGGER_MS_MAX - STAGGER_MS_MIN + 1)) +
      STAGGER_MS_MIN;
    const delay = baseDelayMs + index * jitter;

    return {
      name: "send-message" as const,
      data: { phone, message, centerId } satisfies WhatsAppJobData,
      opts: { ...DEFAULT_JOB_OPTS, delay },
    };
  });

  await queue.addBulk(jobs);
  console.log(
    `[WAQueue] Queued ${jobs.length} broadcast messages with staggered delays.`
  );
}
