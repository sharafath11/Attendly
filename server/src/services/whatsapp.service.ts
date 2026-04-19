import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export type WhatsAppSendResult = { ok: true; messageId?: string } | { ok: false; error: string };

const provider = () => process.env.WHATSAPP_PROVIDER || "twilio";

/** When true, try template ContentSid first (Twilio WhatsApp approved templates). */
const useTemplates = () => process.env.WHATSAPP_USE_TEMPLATES === "true";

/**
 * Map logical template names to Twilio Content SIDs (env).
 * Example: TWILIO_CONTENT_SID_FEE_REMINDER=HXxxxx...
 */
function resolveContentSid(templateName: string): string | undefined {
  const key = templateName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return (
    process.env[`TWILIO_CONTENT_SID_${key}`] ||
    process.env[`TWILIO_TEMPLATE_${key}`] ||
    undefined
  );
}

/**
 * Send WhatsApp using Twilio Content API template (variables are JSON string keys "1","2",... per Twilio).
 * Falls back to session message (Body) when templates disabled or SID missing.
 */
export async function sendTemplateMessage(
  templateName: string,
  variables: Record<string, string>,
  toPhoneDigits: string
): Promise<WhatsAppSendResult> {
  const digits = toPhoneDigits.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Invalid phone number" };
  }

  if (provider() === "dialog360") {
    return send360Template(templateName, variables, digits);
  }

  return sendTwilioTemplateOrFallback(templateName, variables, digits);
}

function buildTwilioContentVariables(variables: Record<string, string>): string {
  const numericKeys = Object.keys(variables)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
  const map: Record<string, string> = {};
  let i = 1;
  for (const k of numericKeys) {
    map[String(i)] = variables[k];
    i += 1;
  }
  return JSON.stringify(map);
}

async function sendTwilioTemplateOrFallback(
  templateName: string,
  variables: Record<string, string>,
  digits: string
): Promise<WhatsAppSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return {
      ok: false,
      error:
        "Twilio WhatsApp not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)",
    };
  }

  const to = `whatsapp:+91${digits}`;
  const contentSid = useTemplates() ? resolveContentSid(templateName) : undefined;

  const body = new URLSearchParams();
  body.set("To", to);
  body.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);

  if (contentSid) {
    body.set("ContentSid", contentSid);
    body.set("ContentVariables", buildTwilioContentVariables(variables));
  } else {
    const fallback =
      variables.body ||
      variables.message ||
      Object.keys(variables)
        .filter((k) => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => variables[k])
        .join(" — ") || "Message from Attendly";
    body.set("Body", fallback);
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as { sid?: string; message?: string; error_message?: string };
  if (!res.ok) {
    if (contentSid && (data.error_message?.includes("63016") || data.message?.includes("63016"))) {
      return sendViaTwilioSession(digits, Object.values(variables).join(" — ") || "Attendly update");
    }
    return { ok: false, error: data.error_message || data.message || `HTTP ${res.status}` };
  }
  return { ok: true, messageId: data.sid };
}

/** Session message (outside 24h window may fail — templates preferred). */
export async function sendWhatsAppMessage(toPhoneDigits: string, message: string): Promise<WhatsAppSendResult> {
  const p = provider();
  const digits = toPhoneDigits.replace(/\D/g, "");
  if (digits.length < 10) {
    return { ok: false, error: "Invalid phone number" };
  }

  if (p === "dialog360") {
    return sendVia360Dialog(digits, message);
  }

  return sendViaTwilioSession(digits, message);
}

async function sendViaTwilioSession(digits: string, message: string): Promise<WhatsAppSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    return {
      ok: false,
      error:
        "Twilio WhatsApp not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)",
    };
  }

  const to = `whatsapp:+91${digits}`;
  const body = new URLSearchParams();
  body.set("To", to);
  body.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  body.set("Body", message);

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as { sid?: string; message?: string; error_message?: string };
  if (!res.ok) {
    return { ok: false, error: data.error_message || data.message || `HTTP ${res.status}` };
  }
  return { ok: true, messageId: data.sid };
}

async function send360Template(
  templateName: string,
  variables: Record<string, string>,
  digits: string
): Promise<WhatsAppSendResult> {
  const key = process.env.DIALOG360_API_KEY;
  if (!key) {
    return { ok: false, error: "DIALOG360_API_KEY missing" };
  }

  const templateNamespace = process.env.DIALOG360_TEMPLATE_NAMESPACE;
  const templateNameEnv = process.env[`DIALOG360_TEMPLATE_${templateName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`];

  if (templateNamespace && templateNameEnv) {
    const res = await fetch("https://waba-v2.360dialog.io/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": key,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits.startsWith("91") ? digits : `91${digits}`,
        type: "template",
        template: {
          namespace: templateNamespace,
          name: templateNameEnv,
          language: { code: process.env.DIALOG360_TEMPLATE_LANG || "en" },
          components: [
            {
              type: "body",
              parameters: Object.values(variables).map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    const data = (await res.json()) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  }

  return sendVia360Dialog(digits, Object.values(variables).join(" — ") || "Attendly");
}

async function sendVia360Dialog(digits: string, message: string): Promise<WhatsAppSendResult> {
  const key = process.env.DIALOG360_API_KEY;
  if (!key) {
    return { ok: false, error: "DIALOG360_API_KEY missing" };
  }

  const res = await fetch("https://waba-v2.360dialog.io/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "D360-API-KEY": key,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: digits.startsWith("91") ? digits : `91${digits}`,
      type: "text",
      text: { body: message, preview_url: false },
    }),
  });

  const data = (await res.json()) as { messages?: { id?: string }[]; error?: { message?: string } };
  if (!res.ok) {
    return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
  }
  const id = data.messages?.[0]?.id;
  return { ok: true, messageId: id };
}
