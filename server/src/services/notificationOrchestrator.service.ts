import mongoose from "mongoose";
import { injectable } from "tsyringe";
import { SocketService } from "./socket.service";
import { NotificationModel } from "../models/notification.model";
import { CenterModel } from "../models/center.model";
import { UserModel } from "../models/user.Model";
import { StudentModel } from "../models/students.model";
import { BatchModel } from "../models/batches.model";
import { FeeModel } from "../models/fees.model";
import { sendTemplateMessage, sendWhatsAppMessage } from "./whatsapp.service";
import { enqueueBroadcast } from "./whatsappQueue.service";
import { canSendFeeReminderToday } from "../utils/notificationThrottle.util";
import { normalizePhoneDigits } from "../utils/phone.util";
import { ParentEmailTemplates } from "../const/parentEmailTemplates";
import { sendTransactionalHtml } from "../utils/mail.util";
import { ParentNotificationModel } from "../models/parentNotification.model";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveParentUserId(
  centerId: string,
  phoneDigits: string
): Promise<mongoose.Types.ObjectId | undefined> {
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
  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

// ─── Service ──────────────────────────────────────────────────────────────────

@injectable()
export class NotificationOrchestratorService {
  // ── Fee Reminder ──────────────────────────────────────────────────────────

  async sendFeeReminder(
    centerId: string,
    studentId: string,
    actorUserId?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const allowed = await canSendFeeReminderToday(centerId, studentId);
    if (!allowed) return;

    // ── Use actual fee record amount; fall back to student.monthlyFee if no record yet ──
    const now = new Date();
    const istStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const [istYear, istMonth] = istStr.split("-").map(Number);

    const feeRecord = await FeeModel.findOne({
      studentId: student._id,
      month: istMonth,
      year: istYear,
      status: { $in: ["Pending", "Overdue"] },
    })
      .select("amount")
      .lean()
      .exec();

    const feeAmount = feeRecord?.amount ?? student.monthlyFee;

    const phoneDigits = student.parentPhone
      ? normalizePhoneDigits(student.parentPhone)
      : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const batch = await BatchModel.findById(student.batchId).lean().exec();
    const classLabel = batch ? `${batch.classLevel} (${batch.batchName})` : "N/A";
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = monthNames[istMonth - 1] || String(istMonth);
    const centerName = center?.name || "Our Center";

    const payUrl = `${clientBaseUrl()}/parent/fees`;
    const msg = `Dear Parent,\n\nThis is a fee reminder from *${centerName}*.\n\n• *Student Name:* ${student.name}\n• *Class:* ${classLabel}\n• *Billing Month:* ${monthLabel} ${istYear}\n• *Pending Amount:* ₹${feeAmount}\n\nPlease complete payment here: ${payUrl}\n\nThank you!`;

    const parentUserId = phoneDigits
      ? await resolveParentUserId(centerId, phoneDigits)
      : undefined;

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
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "failed", error: "No parent phone on file" }
      );
      return;
    }

    const tplVars: Record<string, string> = {
      "1": student.name,
      "2": String(feeAmount),
      "3": payUrl,
      "4": center?.name ?? "Center",
      body: msg,
    };

    const wa = await sendTemplateMessage(
      "fee_reminder",
      tplVars,
      phoneDigits,
      centerId,
      doc._id.toString()
    );

    const owner = await UserModel.findOne({ centerId, role: "center_owner" }).lean().exec();
    if (owner) {
      await SocketService.createAndSendNotification(
        centerId,
        owner._id.toString(),
        "Fee Reminder Triggered",
        `Fee reminder of ₹${feeAmount} sent to ${student.name}`,
        "fee_reminder_triggered",
        { studentId, studentName: student.name, amount: feeAmount }
      );
    }

    // Email fallback only if queuing itself failed (rare — Redis down, etc.)
    if (!wa.ok && center?.email) {
      const tpl = ParentEmailTemplates.feeReminder(
        student.name,
        `₹${feeAmount}`,
        "Thank you."
      );
      try {
        await sendTransactionalHtml(
          center.email,
          tpl.subject,
          tpl.html,
          tpl.text
        );
        await NotificationModel.create({
          centerId: new mongoose.Types.ObjectId(centerId),
          userId: actorUserId
            ? new mongoose.Types.ObjectId(actorUserId)
            : undefined,
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

  // ── Attendance Alert ──────────────────────────────────────────────────────

  async sendAttendanceAlert(
    centerId: string,
    studentId: string,
    dateStr: string,
    status: string,
    actorUserId?: string,
    subject?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const phoneDigits = student.parentPhone
      ? normalizePhoneDigits(student.parentPhone)
      : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const batch = await BatchModel.findById(student.batchId).lean().exec();
    const batchLabel = batch?.batchName ?? "class";

    const parentUserId = phoneDigits
      ? await resolveParentUserId(centerId, phoneDigits)
      : undefined;

    // Resolve specific parent name
    const parentUser = parentUserId ? await UserModel.findById(parentUserId).lean().exec() : null;
    const parentName = parentUser?.name || "Parent";

    // Format date as DD-MM-YYYY
    let formattedDate = dateStr;
    if (dateStr && dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    const now = new Date();
    const timestamp = now.toTimeString().split(" ")[0]; // HH:MM:SS

    const subjectText = subject ? ` for ${subject}` : "";

    let displayStatus = String(status).toUpperCase();
    if (displayStatus === "HALF_DAY") displayStatus = "HALF DAY";

    const msg =
      String(status).toLowerCase() === "absent"
        ? `Dear ${parentName},\n\nWe would like to inform you that your child, ${student.name}, is marked ABSENT today (${formattedDate})${subjectText}. Please let us know if this was planned.\n\nThank you,\n${center?.name ?? "Center"}`
        : `Dear ${parentName},\n\nThis is to inform you that your child, ${student.name}, was marked ${displayStatus} today (${formattedDate})${subjectText}.\n\nThank you,\n${center?.name ?? "Center"}`;

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
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "failed", error: "No parent phone" }
      );
      return;
    }

    // Persist into ParentNotification collection for Inbox display
    let parentNotificationId: string | undefined = undefined;
    if (parentUserId) {
      const parentNotif = await ParentNotificationModel.create({
        parentUserId,
        studentId: student._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        title: "Attendance Notification",
        message: msg,
        status: "queued",
      });
      parentNotificationId = (parentNotif as any)._id.toString();
    }

    const wa = await sendTemplateMessage(
      "attendance_alert",
      {
        "1": batchLabel,
        "2": student.name,
        "3": status,
        "4": formattedDate,
        body: msg,
      },
      phoneDigits,
      centerId,
      doc._id.toString(),
      parentNotificationId
    );

    // Email fallback only if enqueue itself failed
    if (!wa.ok && center?.email) {
      const tpl = ParentEmailTemplates.attendanceAlert(
        student.name,
        status,
        formattedDate
      );
      try {
        await sendTransactionalHtml(
          center.email,
          tpl.subject,
          tpl.html,
          tpl.text
        );
      } catch (e) {
        console.error("[Notification] email fallback failed", e);
      }
    }
  }

  async sendAttendanceCorrectionAlert(
    centerId: string,
    studentId: string,
    dateStr: string,
    actorUserId?: string,
    subject?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const phoneDigits = student.parentPhone
      ? normalizePhoneDigits(student.parentPhone)
      : "";
    if (!phoneDigits) return;

    const center = await CenterModel.findById(centerId).lean().exec();
    const centerName = center?.name ?? "Center";

    const parentUserId = await resolveParentUserId(centerId, phoneDigits);
    const parentUser = parentUserId ? await UserModel.findById(parentUserId).lean().exec() : null;
    const parentName = parentUser?.name || "Parent";

    const now = new Date();
    const timestamp = now.toTimeString().split(" ")[0];

    const msg = `Dear ${parentName}, Correction from ${centerName}. Your child ${student.name} is marked PRESENT today. Please ignore the previous absence alert. Sorry for the oversight. (Ref: ${timestamp})`;

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

    let parentNotificationId: string | undefined = undefined;
    if (parentUserId) {
      const parentNotif = await ParentNotificationModel.create({
        parentUserId,
        studentId: student._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        title: "Attendance Correction",
        message: msg,
        status: "queued",
      });
      parentNotificationId = (parentNotif as any)._id.toString();
    }

    await sendTemplateMessage(
      "attendance_alert_correction",
      { body: msg },
      phoneDigits,
      centerId,
      doc._id.toString(),
      parentNotificationId
    );
  }

  // ── Broadcast ─────────────────────────────────────────────────────────────

  async sendBroadcast(
    centerId: string,
    message: string,
    actorUserId?: string
  ): Promise<{ sent: number; failed: number }> {
    const center = await CenterModel.findById(centerId).lean().exec();
    const rawPhones = await StudentModel.distinct("parentPhone", {
      centerId: new mongoose.Types.ObjectId(centerId),
      isDeleted: false,
      parentPhone: { $exists: true, $ne: "" },
    });

    const validPhones: string[] = (rawPhones as string[])
      .map((p) => normalizePhoneDigits(p))
      .filter((d) => d.length >= 10);

    if (validPhones.length === 0) return { sent: 0, failed: 0 };

    const fullMessage = `${center?.name ?? "Center"}: ${message}`;

    // Create a queued notification record for audit trail
    await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      type: "broadcast",
      channel: "whatsapp",
      status: "queued",
      message: fullMessage,
    });

    // Enqueue all numbers with 5–8 s staggered delay (anti-ban)
    try {
      await enqueueBroadcast(validPhones, fullMessage, centerId);
      return { sent: validPhones.length, failed: 0 };
    } catch (err) {
      console.error("[Notification] broadcast enqueue failed", err);
      return { sent: 0, failed: validPhones.length };
    }
  }

  // ── Payment Confirmation ──────────────────────────────────────────────────

  async sendPaymentConfirmation(
    centerId: string,
    studentId: string,
    amountInr: number,
    actorUserId?: string
  ): Promise<void> {
    const student = await StudentModel.findById(studentId).lean().exec();
    if (!student || student.isDeleted) return;

    const phoneDigits = student.parentPhone
      ? normalizePhoneDigits(student.parentPhone)
      : "";
    const center = await CenterModel.findById(centerId).lean().exec();
    const parentUser = phoneDigits ? await resolveParentUserId(centerId, phoneDigits).then(id => id ? UserModel.findById(id).lean().exec() : null) : null;
    const parentName = parentUser?.name || student.parentName || "Parent";
    const centerName = center?.name || "Our Center";

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

    const msg = `Dear ${parentName},\n\nWe have successfully received the fee payment of ₹${amountInr} for your child, ${student.name}.\n\n📅 Date: ${formattedDate}\n⏰ Time: ${formattedTime}\n\nThank you for your prompt payment!\n\nBest Regards,\n${centerName}`;

    const parentUserId = phoneDigits
      ? await resolveParentUserId(centerId, phoneDigits)
      : undefined;

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
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "failed", error: "No parent phone" }
      );
      return;
    }

    // Persist ParentNotification log
    let parentNotificationId: string | undefined = undefined;
    if (parentUserId) {
      const parentNotif = await ParentNotificationModel.create({
        parentUserId,
        studentId: student._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        title: "Payment Confirmation",
        message: msg,
        status: "queued",
      });
      parentNotificationId = (parentNotif as any)._id.toString();
    }

    await sendTemplateMessage(
      "payment_confirmation",
      {
        "1": String(amountInr),
        "2": student.name,
        "3": center?.name ?? "Center",
        body: msg,
      },
      phoneDigits,
      centerId,
      doc._id.toString(),
      parentNotificationId
    );
  }

  // ── Combined Unpaid Follow-Up ─────────────────────────────────────────────

  async sendCombinedUnpaidFollowUp(
    centerId: string,
    studentId: string,
    feeAmountInr: number
  ): Promise<void> {
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

    const phoneDigits = student.parentPhone
      ? normalizePhoneDigits(student.parentPhone)
      : "";
    const payUrl = `${clientBaseUrl()}/parent/fees`;
    const msg = `Update:\n• Fee pending: ₹${feeAmountInr}\n• Follow-up: Please complete payment.\nPay here: ${payUrl}`;

    const parentUserId = phoneDigits
      ? await resolveParentUserId(centerId, phoneDigits)
      : undefined;

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
      await NotificationModel.updateOne(
        { _id: doc._id },
        { status: "failed", error: "No parent phone" }
      );
      return;
    }

    // Persist ParentNotification log
    let parentNotificationId: string | undefined = undefined;
    if (parentUserId) {
      const parentNotif = await ParentNotificationModel.create({
        parentUserId,
        studentId: student._id,
        centerId: new mongoose.Types.ObjectId(centerId),
        title: "Fee Reminder",
        message: msg,
        status: "queued",
      });
      parentNotificationId = (parentNotif as any)._id.toString();
    }

    await sendTemplateMessage(
      "combined_alert",
      {
        "1": String(feeAmountInr),
        "2": payUrl,
        "3": student.name,
        body: msg,
      },
      phoneDigits,
      centerId,
      doc._id.toString(),
      parentNotificationId
    );
  }

  // ── Owner Email Nudges (unchanged) ────────────────────────────────────────

  async sendOwnerAttendanceNudgeEmail(
    centerId: string,
    ownerEmail: string,
    centerName: string
  ): Promise<void> {
    const subject = "Reminder: mark today's attendance";
    const text = `Hi — don't forget to mark attendance for ${centerName} in Attendly today.`;
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
    const html = `<p><strong>${centerName}</strong></p><ul>${lines
      .map((l) => `<li>${l}</li>`)
      .join("")}</ul>`;
    try {
      const { sendTransactionalHtml } = await import("../utils/mail.util");
      await sendTransactionalHtml(ownerEmail, subject, html, text);
    } catch (e) {
      console.warn("[Retention] weekly email skipped", e);
    }
  }

  async sendTeacherAssignmentNotification(
    centerId: string,
    teacherId: string,
    type: "batch" | "subject",
    details: { name: string; info: string }
  ): Promise<void> {
    const teacher = await UserModel.findById(teacherId).lean().exec();
    if (!teacher || teacher.role !== "teacher" || !teacher.phone) return;

    const center = await CenterModel.findById(centerId).lean().exec();
    const centerName = center?.name || "Our Center";
    
    let msg = "";
    if (type === "batch") {
      msg = `Dear ${teacher.name},\n\nYou have been assigned to a new batch at *${centerName}*:\n\n• *Batch:* ${details.name}\n• *Schedule:* ${details.info}\n\nPlease check your teacher portal for details.\n\nThank you!`;
    } else {
      msg = `Dear ${teacher.name},\n\nYou have been assigned new subjects at *${centerName}*:\n\n• *Subjects:* ${details.info}\n\nPlease check your teacher portal for details.\n\nThank you!`;
    }

    const phoneDigits = normalizePhoneDigits(teacher.phone);
    if (phoneDigits.length < 10) return;

    // Create notification log
    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      type: "system",
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    await sendWhatsAppMessage(phoneDigits, msg, centerId, doc._id.toString());
  }

  // ── Teacher Payment Alert ────────────────────────────────────────────────
  
  async sendTeacherPaymentAlert(
    centerId: string,
    teacherId: string,
    amount: number,
    note?: string,
    actorUserId?: string
  ): Promise<void> {
    const teacher = await UserModel.findById(teacherId).lean().exec();
    if (!teacher || teacher.status === "disabled") return;

    const phoneDigits = teacher.phone ? normalizePhoneDigits(teacher.phone) : "";
    if (!phoneDigits || phoneDigits.length < 10) return;

    const center = await CenterModel.findById(centerId).lean().exec();
    const centerName = center?.name || "Our Center";

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
    
    let msg = `Dear ${teacher.name ?? "Teacher"},\n\nWe have credited your salary of ₹${amount} on ${formattedDate}.\n\n`;
    if (note) {
      msg += `Note: ${note}\n\n`;
    }
    msg += `Thank you for your hard work!\n\nBest Regards,\n${centerName}`;

    const doc = await NotificationModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: actorUserId ? new mongoose.Types.ObjectId(actorUserId) : undefined,
      type: "system", // Generic alert for teacher
      channel: "whatsapp",
      status: "queued",
      message: msg,
    });

    await sendWhatsAppMessage(phoneDigits, msg, centerId, doc._id.toString());
  }
}
