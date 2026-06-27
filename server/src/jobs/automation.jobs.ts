import mongoose from "mongoose";
import { CenterModel } from "../models/center.model";
import { AutomationSettingsModel } from "../models/automationSettings.model";
import { StudentModel } from "../models/students.model";
import { BatchModel } from "../models/batches.model";
import { AttendanceModel } from "../models/attendance.model";
import { FeeModel } from "../models/fees.model";
import { UserModel } from "../models/user.Model";
import { FeesRepository } from "../repository/fees.repository";
import { NotificationOrchestratorService } from "../services/notificationOrchestrator.service";
import { NotificationModel } from "../models/notification.model";
import { container } from "../core/di/container";

const HOUR_MS = 60 * 60 * 1000;

function istNowParts() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function istCalendarDay(): number {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return Number(s.split("-")[2]);
}

function istWeekdayShort(): string {
  return new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "short" });
}

function istDateStartUtc(): Date {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${s}T00:00:00.000Z`);
}

/** Hour 0–23 in Asia/Kolkata */
function istHour(): number {
  const hourPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  })
    .formatToParts(new Date())
    .find((p) => p.type === "hour");
  return Number(hourPart?.value ?? 0);
}

export function startAutomationJobs() {
  const feesRepo = new FeesRepository();
  const notifications = container.resolve(NotificationOrchestratorService);

  const runMonthlyFees = async () => {
    const now = new Date();
    if (istCalendarDay() !== 1 && process.env.AUTOMATION_FORCE_MONTHLY !== "true") return;

    const settings = await AutomationSettingsModel.find({ autoFeeGeneration: true }).lean().exec();
    for (const s of settings) {
      const centerId = s.centerId.toString();
      const center = await CenterModel.findById(centerId).lean().exec();
      if (!center || center.subscriptionStatus !== "active" || center.blocked) continue;

      await feesRepo.ensureFeesForMonth(centerId, { month: now.getMonth() + 1, year: now.getFullYear() });
    }
  };

  const runFeeReminders = async () => {
    const settings = await AutomationSettingsModel.find({ feeReminderEnabled: true }).lean().exec();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dayOfMonth = istCalendarDay();

    const isLastDayOfMonth = () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const s = tomorrow.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const tomorrowDay = Number(s.split("-")[2]);
      return tomorrowDay === 1;
    };

    for (const s of settings) {
      const centerId = s.centerId.toString();
      const center = await CenterModel.findById(centerId).lean().exec();
      if (!center || center.subscriptionStatus !== "active" || center.blocked) continue;

      const targetDays = s.feeReminderDays && s.feeReminderDays.length > 0 ? s.feeReminderDays : [5, 10, 25];
      const isTodayScheduled = targetDays.includes(dayOfMonth) || (dayOfMonth >= 28 && isLastDayOfMonth() && targetDays.includes(31));
      if (!isTodayScheduled) continue;

      const pending = await FeeModel.find({
        centerId: new mongoose.Types.ObjectId(centerId),
        month,
        year,
        status: { $in: ["Pending", "Overdue"] },
      })
        .lean()
        .exec();

      for (const fee of pending) {
        await notifications.sendFeeReminder(centerId, fee.studentId.toString());
      }
    }
  };

  /** If a fee reminder was sent 2+ days ago and fee is still unpaid, send combined_alert (throttled in orchestrator). */
  const runFeeFollowUps = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const settings = await AutomationSettingsModel.find({ feeReminderEnabled: true }).lean().exec();

    for (const s of settings) {
      const centerId = s.centerId.toString();
      const center = await CenterModel.findById(centerId).lean().exec();
      if (!center || center.subscriptionStatus !== "active" || center.blocked) continue;

      const pending = await FeeModel.find({
        centerId: new mongoose.Types.ObjectId(centerId),
        month,
        year,
        status: { $in: ["Pending", "Overdue"] },
      })
        .lean()
        .exec();

      for (const fee of pending) {
        const lastSent = await NotificationModel.findOne({
          centerId: fee.centerId,
          studentId: fee.studentId,
          type: "fee_reminder",
          status: "sent",
          channel: "whatsapp",
        })
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        if (!lastSent || now.getTime() - new Date(lastSent.createdAt).getTime() < twoDaysMs) {
          continue;
        }

        await notifications.sendCombinedUnpaidFollowUp(centerId, fee.studentId.toString(), fee.amount);
      }
    }
  };

  const runAbsentDefaults = async () => {
    const graceHour = Number(process.env.AUTOMATION_ABSENT_GRACE_HOUR_IST ?? "18");
    if (istHour() < graceHour && process.env.AUTOMATION_IGNORE_GRACE !== "true") {
      return;
    }

    const settings = await AutomationSettingsModel.find({ attendanceAutoDefaultAbsent: true }).lean().exec();
    const today = istDateStartUtc();
    const dow = istWeekdayShort();

    for (const s of settings) {
      const centerId = s.centerId.toString();
      const center = await CenterModel.findById(centerId).lean().exec();
      if (!center || center.subscriptionStatus !== "active" || center.blocked) continue;

      const owner = await UserModel.findOne({ centerId: new mongoose.Types.ObjectId(centerId), role: "center_owner" })
        .lean()
        .exec();
      const markedBy = owner?._id ?? new mongoose.Types.ObjectId(centerId);

      const batches = await BatchModel.find({
        centerId: new mongoose.Types.ObjectId(centerId),
        days: dow,
      })
        .lean()
        .exec();

      for (const batch of batches) {
        const students = await StudentModel.find({
          batchId: batch._id,
          centerId: new mongoose.Types.ObjectId(centerId),
          isDeleted: false,
        })
          .lean()
          .exec();

        for (const st of students) {
          const exists = await AttendanceModel.findOne({
            studentId: st._id,
            date: today,
          })
            .lean()
            .exec();
          if (exists) continue;

          await AttendanceModel.create({
            centerId: new mongoose.Types.ObjectId(centerId),
            batchId: batch._id,
            studentId: st._id,
            date: today,
            status: "absent",
            markedBy,
          });
        }
      }
    }
  };

  const tick = async () => {
    try {
      await runMonthlyFees();
      await runFeeReminders();
      await runFeeFollowUps();
      await runAbsentDefaults();
    } catch (e) {
      console.error("[AutomationJobs] tick failed", e);
    }
  };

  console.log("[AutomationJobs] scheduled (hourly) — IST context:", istNowParts());
  setInterval(tick, HOUR_MS);
  tick().catch((e) => console.error("[AutomationJobs] initial", e));
}
