import { enqueueWhatsAppMessage } from "./whatsappQueue.service";
import { normalizePhoneDigits } from "../utils/phone.util";

// ─── Result type (kept for compatibility with call-sites) ─────────────────────

export type WhatsAppSendResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert any phone input to E.164 digits (no "+").
 *  "91XXXXXXXXXX" → kept as-is
 *  "XXXXXXXXXX"   → prefixed with "91" (Indian default)
 */
function toE164Digits(input: string): string {
  const digits = normalizePhoneDigits(input); // last 10 significant digits
  return digits.length === 10 ? `91${digits}` : digits;
}

// ─── Primary API ─────────────────────────────────────────────────────────────

/**
 * Enqueue a single WhatsApp message via BullMQ.
 * Replaces the old Twilio / 360dialog session send.
 */
export async function sendWhatsAppMessage(
  toPhoneDigits: string,
  message: string,
  centerId = "system",
  notificationId?: string,
  parentNotificationId?: string
): Promise<WhatsAppSendResult> {
  const digits = normalizePhoneDigits(toPhoneDigits);
  if (digits.length < 10) {
    return { ok: false, error: "Invalid phone number — fewer than 10 digits." };
  }

  const phone = toE164Digits(toPhoneDigits);

  try {
    await enqueueWhatsAppMessage({ phone, message, centerId, notificationId, parentNotificationId });
    return { ok: true }; // job was queued; delivery happens asynchronously
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[WA] Failed to enqueue message:", error);
    return { ok: false, error };
  }
}

/**
 * Template-style wrapper kept for compatibility with the orchestrator.
 * Simply builds the body string and enqueues — no external API call.
 */
export async function sendTemplateMessage(
  _templateName: string,
  variables: Record<string, string>,
  toPhoneDigits: string,
  centerId = "system",
  notificationId?: string,
  parentNotificationId?: string
): Promise<WhatsAppSendResult> {
  // Build message body from the "body" key, or fall back to joining all numeric-keyed values
  const body =
    variables.body ||
    variables.message ||
    Object.keys(variables)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => variables[k])
      .join(" — ") ||
      "Message from Attendly";

  return sendWhatsAppMessage(toPhoneDigits, body, centerId, notificationId, parentNotificationId);
}
