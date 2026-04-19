import mongoose from "mongoose";
import { injectable } from "tsyringe";
import { NotificationModel } from "../models/notification.model";
import { CenterModel } from "../models/center.model";
import { UserModel } from "../models/user.Model";
import { StudentModel } from "../models/students.model";
import { BatchModel } from "../models/batches.model";
import { sendTemplateMessage, sendWhatsAppMessage } from "./whatsapp.service";
import { canSendFeeReminderToday } from "../utils/notificationThrottle.util";
import { normalizePhoneDigits } from "../utils/phone.util";
import { ParentEmailTemplates } from "../const/parentEmailTemplates";
import { sendTransactionalHtml } from "../utils/mail.util";

async function resolveParentUserId(centerId: string, phoneDigits: string): Promise<mongoose.Types.ObjectId | undefined> {
  const u = await UserModel.findOne({
    role: "parent",
    centerId: new mongoose.Types.ObjectId(centerId),
    phone: phoneDigits,
  })
    .select("_id")
    .lean()
    .exec();
  return u?._id;
}

function clientBaseUrl(): string {
  return (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

@injectable()
export class NotificationOrchestratorService {
  async sendFeeReminder(centerId: string, studentId: string, actorUserId?: string): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const allowed = await canSendFeeReminderToday(centerId, studentId);
    if (!allowed) {
      return;
    }

    const phoneDigits = student.parentPhone ? normalizePhoneDigits(student.parentPhone) : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const payUrl = `${clientBaseUrl()}/parent/fees`;
    const msg = `Hi, your child's fee of ₹${student.monthlyFee} is pending.\nPlease pay here: ${payUrl}`;

    const parentUserId = phoneDigits ? await resolveParentUserId(centerId, phoneDigits) : undefined;

    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      parentUserId,
      studentId: student._id,
      type: "fee_reminder",
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    if (!phoneDigits) {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: "No parent phone on file" });
      return;
    }

    const tplVars: Record<string, string> = {
      "1": student.name,
      "2": String(student.monthlyFee),
      "3": payUrl,
      "4": center?.name ?? "Center",
      body: msg,
    };
    let wa = await sendTemplateMessage("fee_reminder", tplVars, phoneDigits);
    if (!wa.ok && process.env.WHATSAPP_TEMPLATE_FALLBACK !== "false") {
      wa = await sendWhatsAppMessage(phoneDigits, msg);
    }
    if (wa.ok) {
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "sent", providerMessageId: wa.messageId ?? undefined }
      );
      return;
    }

    await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: wa.error });

    if (center?.email) {
      const tpl = ParentEmailTemplates.feeReminder(student.name, `₹${student.monthlyFee}`, "Thank you.");
      try {
        await sendTransactionalHtml(center.email, tpl.subject, tpl.html, tpl.text);
        await NotificationModel.create({
          centerId: new mongoose.Types.ObjectId(centerId),
          userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
          parentUserId,
          studentId: student._id,
          type: "fee_reminder",
          channel: "email",
          status: "sent",
          message: tpl.text,
        });
      } catch (e) {
        console.error("[Notification] email fallback failed", e);
      }
    }
  }

  async sendAttendanceAlert(
    centerId: string,
    studentId: string,
    dateStr: string,
    status: string,
    actorUserId?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;
    const phoneDigits = student.parentPhone ? normalizePhoneDigits(student.parentPhone) : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const batch = await BatchModel.findById(student.batchId).lean().exec();
    const batchLabel = batch?.batchName ?? "class";
    const msg =
      String(status).toLowerCase() === "absent"
        ? `Your child was absent today in ${batchLabel}.`
        : `${student.name} was marked ${status} on ${dateStr} at ${center?.name ?? "your center"}.`;

    const parentUserId = phoneDigits ? await resolveParentUserId(centerId, phoneDigits) : undefined;

    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      parentUserId,
      studentId: student._id,
      type: "attendance_alert",
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    if (!phoneDigits) {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: "No parent phone" });
      return;
    }

    let wa = await sendTemplateMessage(
      "attendance_alert",
      {
        "1": batchLabel,
        "2": student.name,
        "3": status,
        "4": dateStr,
        body: msg,
      },
      phoneDigits
    );
    if (!wa.ok && process.env.WHATSAPP_TEMPLATE_FALLBACK !== "false") {
      wa = await sendWhatsAppMessage(phoneDigits, msg);
    }
    if (wa.ok) {
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "sent", providerMessageId: wa.messageId ?? undefined }
      );
    } else {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: wa.error });
      if (center?.email) {
        const tpl = ParentEmailTemplates.attendanceAlert(student.name, status, dateStr);
        try {
          await sendTransactionalHtml(center.email, tpl.subject, tpl.html, tpl.text);
        } catch (e) {
          console.error("[Notification] email fallback failed", e);
        }
      }
    }
  }

  async sendBroadcast(centerId: string, message: string, actorUserId?: string): Promise<{ sent: number; failed: number }> {
    const center = await CenterModel.findById(centerId).lean().exec();
    const phones = await StudentModel.distinct("parentPhone", {
      centerId: new mongoose.Types.ObjectId(centerId),
      isDeleted: false,
      parentPhone: { $exists: true, $ne: "" },
    });

    let sent = 0;
    let failed = 0;

    for (const p of phones as string[]) {
      const digits = normalizePhoneDigits(p);
      if (digits.length < 10) continue;
      const parentUserId = await resolveParentUserId(centerId, digits);
      const doc = await NotificationModel.create({
        centerId: new mongoose.Types.ObjectId(centerId),
        userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
        parentUserId,
        type: "broadcast",
        channel: "whatsapp",
        status: "queued",
        message: `${center?.name ?? "Center"}: ${message}`,
      });

      const wa = await sendWhatsAppMessage(digits, `${center?.name ?? "Center"}: ${message}`);
      if (wa.ok) {
        sent++;
        await NotificationModel.updateOne(
          { _id: doc._id },
          { status: "sent", providerMessageId: wa.messageId ?? undefined }
        );
      } else {
        failed++;
        await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: wa.error });
      }
    }

    return { sent, failed };
  }

  /** After successful Razorpay verification — WhatsApp template `payment_confirmation`. */
  async sendPaymentConfirmation(
    centerId: string,
    studentId: string,
    amountInr: number,
    actorUserId?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;
    const phoneDigits = student.parentPhone ? normalizePhoneDigits(student.parentPhone) : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const msg = `Payment of ₹${amountInr} received. Thank you!`;

    const parentUserId = phoneDigits ? await resolveParentUserId(centerId, phoneDigits) : undefined;

    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      parentUserId,
      studentId: student._id,
      type: "payment_confirmation",
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    if (!phoneDigits) {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: "No parent phone" });
      return;
    }

    let wa = await sendTemplateMessage(
      "payment_confirmation",
      { "1": String(amountInr), "2": student.name, "3": center?.name ?? "Center", body: msg },
      phoneDigits
    );
    if (!wa.ok && process.env.WHATSAPP_TEMPLATE_FALLBACK !== "false") {
      wa = await sendWhatsAppMessage(phoneDigits, msg);
    }
    if (wa.ok) {
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "sent", providerMessageId: wa.messageId ?? undefined }
      );
    } else {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: wa.error });
    }
  }

  /**
   * Follow-up when fee still unpaid 2+ days after a reminder — template `combined_alert`.
   */
  async sendCombinedUnpaidFollowUp(centerId: string, studentId: string, feeAmountInr: number): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const recentCombined = await NotificationModel.findOne({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: student._id,
      type: "combined_alert",
      createdAt: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    })
      .lean()
      .exec();
    if (recentCombined) return;

    const phoneDigits = student.parentPhone ? normalizePhoneDigits(student.parentPhone) : "";
    const payUrl = `${clientBaseUrl()}/parent/fees`;
    const msg = `Update:\n• Fee pending: ₹${feeAmountInr}\n• Follow-up: Please complete payment.\nPay here: ${payUrl}`;

    const parentUserId = phoneDigits ? await resolveParentUserId(centerId, phoneDigits) : undefined;

    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      parentUserId,
      studentId: student._id,
      type: "combined_alert",
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    if (!phoneDigits) {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: "No parent phone" });
      return;
    }

    let wa = await sendTemplateMessage(
      "combined_alert",
      {
        "1": String(feeAmountInr),
        "2": payUrl,
        "3": student.name,
        body: msg,
      },
      phoneDigits
    );
    if (!wa.ok && process.env.WHATSAPP_TEMPLATE_FALLBACK !== "false") {
      wa = await sendWhatsAppMessage(phoneDigits, msg);
    }
    if (wa.ok) {
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "sent", providerMessageId: wa.messageId ?? undefined }
      );
    } else {
      await NotificationModel.updateOne({ _id: doc._id }, { status: "failed", error: wa.error });
    }
  }

  /** Owner retention — plain email (optional SMTP / MailBluster). */
  async sendOwnerAttendanceNudgeEmail(centerId: string, ownerEmail: string, centerName: string): Promise<void> {
    const subject = "Reminder: mark today’s attendance";
    const text = `Hi — don’t forget to mark attendance for ${centerName} in Attendly today.`;
    const html = `<p>${text}</p><p><a href="${clientBaseUrl()}/attendance">Open attendance</a></p>`;
    try {
      const { sendTransactionalHtml } = await import("../utils/mail.util");
      await sendTransactionalHtml(ownerEmail, subject, html, text);
    } catch (e) {
      console.warn("[Retention] owner email skipped", e);
    }
  }

  async sendOwnerWeeklySummaryEmail(
    ownerEmail: string,
    centerName: string,
    lines: string[]
  ): Promise<void> {
    const subject = `Weekly summary — ${centerName}`;
    const text = [`${centerName} — this week:`, ...lines].join("\n");
    const html = `<p><strong>${centerName}</strong></p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
    try {
      const { sendTransactionalHtml } = await import("../utils/mail.util");
      await sendTransactionalHtml(ownerEmail, subject, html, text);
    } catch (e) {
      console.warn("[Retention] weekly email skipped", e);
    }
  }
}
