import fetch from "node-fetch";
import dotenv from "dotenv";
import { MailTemplates } from "../const/mailTemplates";

dotenv.config({ path: ".env.local" });
dotenv.config();

// MailBluster configuration — must be set via environment; no hardcoded fallback.
const MAILBLUSTER_API_KEY = process.env.MAILBLUSTER_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_USER;

if (!MAILBLUSTER_API_KEY) throw new Error("MAILBLUSTER_API_KEY env var is missing");
if (!SENDER_EMAIL) throw new Error("EMAIL_USER env var is missing");

/**
 * Generic function to send email via MailBluster API
 */
async function sendMailBlusterEmail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const response = await fetch("https://api.mailbluster.com/v1/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": MAILBLUSTER_API_KEY!,
    },
    body: JSON.stringify({
      from: SENDER_EMAIL,
      to,
      subject,
      text,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("MailBluster API error:", data);
    throw new Error("MAIL_SEND_FAILED");
  }

  console.log(`Email sent to ${to}`);
}

/**
 * Send OTP email
 */
export async function sendEmailOtp(email: string, otp: string) {
  // Always log OTP in console for development/debugging
  console.log(`\n\n=========================================`);
  console.log(`[SECURITY] OTP generated for ${email}: ${otp}`);
  console.log(`=========================================\n\n`);

  try {
    await sendTransactionalHtml(
      email,
      MailTemplates.OTP.SUBJECT,
      MailTemplates.OTP.HTML(otp),
      MailTemplates.OTP.TEXT(otp)
    );
    console.log(`OTP email sent to ${email}`);
  } catch (err: any) {
    console.error(`Failed to send OTP email to ${email}:`, err?.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error("MAIL_SEND_FAILED");
    }
    // In dev mode, we suppress the error so testing can proceed via the logged OTP
  }
}

/**
 * Send mentor status change email
 */
export async function sendMentorStatusChangeEmail(email: string, status: string) {
  await sendMailBlusterEmail(
    email,
    MailTemplates.MENTOR_STATUS_CHANGE.SUBJECT,
    MailTemplates.MENTOR_STATUS_CHANGE.HTML(status),
    MailTemplates.MENTOR_STATUS_CHANGE.TEXT(status)
  );
  console.log(`Mentor status email sent to ${email}`);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  await sendMailBlusterEmail(
    email,
    MailTemplates.PASSWORD_RESET.SUBJECT,
    MailTemplates.PASSWORD_RESET.HTML(resetLink),
    MailTemplates.PASSWORD_RESET.TEXT(resetLink)
  );
  console.log(`Password reset email sent to ${email}`);
}

/**
 * Prefer SMTP (Nodemailer) when SMTP_HOST is set; otherwise MailBluster (same as other emails).
 */
export async function sendTransactionalHtml(to: string, subject: string, html: string, text: string, fromName?: string) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ?? "",
      },
    });
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to,
      subject,
      text,
      html,
    });
    console.log(`[SMTP] transactional email to ${to}`);
    return;
  }
  await sendMailBlusterEmail(to, subject, html, text);
}
