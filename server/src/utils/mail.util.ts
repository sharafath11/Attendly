import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { MailTemplates } from "../const/mailTemplates";

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const allowDevFallback = process.env.EMAIL_DEV_FALLBACK === "true";
const emailEnabled = Boolean(emailUser && emailPass);

if (!emailEnabled && !allowDevFallback) {
  throw new Error("EMAIL_USER or EMAIL_PASS is missing in environment variables");
}

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null;

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error("Email transporter error:", error);
    } else {
      console.log("Email transporter ready");
    }
  });
} else if (allowDevFallback) {
  console.warn("Email disabled; using dev fallback for OTP emails.");
}

export async function sendEmailOtp(
  email: string,
  otp: string
): Promise<void> {
  if (!transporter) {
    console.warn(`[DEV OTP] ${email} -> ${otp}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Learn Vista" <${emailUser}>`,
      to: email,
      subject: MailTemplates.OTP.SUBJECT,
      text: MailTemplates.OTP.TEXT(otp),
      html: MailTemplates.OTP.HTML(otp),
    });

    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send OTP email", error);
    if (allowDevFallback) {
      console.warn(`[DEV OTP] ${email} -> ${otp}`);
      return;
    }
    throw new Error("OTP_EMAIL_SEND_FAILED");
  }
}

export async function sendMentorStatusChangeEmail(
  email: string,
  status: string
): Promise<void> {
  try {
    if (!transporter) {
      throw new Error("EMAIL_TRANSPORTER_DISABLED");
    }
    await transporter.sendMail({
      from: `"Learn Vista" <${emailUser}>`,
      to: email,
      subject: MailTemplates.MENTOR_STATUS_CHANGE.SUBJECT,
      text: MailTemplates.MENTOR_STATUS_CHANGE.TEXT(status),
      html: MailTemplates.MENTOR_STATUS_CHANGE.HTML(status),
    });

    console.log(`Mentor status email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send mentor status email", error);
    throw new Error("MENTOR_STATUS_EMAIL_FAILED");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  try {
    if (!transporter) {
      throw new Error("EMAIL_TRANSPORTER_DISABLED");
    }
    await transporter.sendMail({
      from: `"Learn Vista" <${emailUser}>`,
      to: email,
      subject: MailTemplates.PASSWORD_RESET.SUBJECT,
      text: MailTemplates.PASSWORD_RESET.TEXT(resetLink),
      html: MailTemplates.PASSWORD_RESET.HTML(resetLink),
    });

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send password reset email", error);
    throw new Error("PASSWORD_RESET_EMAIL_FAILED");
  }
}
