import fetch from "node-fetch";
import dotenv from "dotenv";
import { MailTemplates } from "../const/mailTemplates";

dotenv.config();

// MailBluster configuration
const MAILBLUSTER_API_KEY = process.env.MAILBLUSTER_API_KEY || "40f059b2-af00-48fa-9936-ea173d2cc7ac";
const SENDER_EMAIL = process.env.EMAIL_USER;

if (!MAILBLUSTER_API_KEY) throw new Error("MAILBLUSTER_API_KEY is missing");
if (!SENDER_EMAIL) throw new Error("EMAIL_USER is missing");

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
      "api-key": MAILBLUSTER_API_KEY,
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
  await sendMailBlusterEmail(
    email,
    MailTemplates.OTP.SUBJECT,
    MailTemplates.OTP.HTML(otp),
    MailTemplates.OTP.TEXT(otp)
  );
  console.log(`OTP email sent to ${email}`);
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