import { redis } from "./redis";

/**
 * Max 1 fee reminder per student per calendar day (IST date string).
 */
export async function canSendFeeReminderToday(centerId: string, studentId: string): Promise<boolean> {
  const ist = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const key = `notify:fee:${centerId}:${studentId}:${ist}`;
  const existing = await redis.get(key);
  if (existing) return false;
  await redis.set(key, "1", "EX", 86400);
  return true;
}
