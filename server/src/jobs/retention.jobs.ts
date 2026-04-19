import mongoose from "mongoose";
import { CenterModel } from "../models/center.model";
import { UserModel } from "../models/user.Model";
import { StudentModel } from "../models/students.model";
import { AttendanceModel } from "../models/attendance.model";
import { FeeModel } from "../models/fees.model";
import { NotificationOrchestratorService } from "../services/notificationOrchestrator.service";
import { container } from "../core/di/container";
import { istCalendarDay, istDateString, istHour, istMonthYear, istWeekdayShort } from "../utils/ist.util";

const HOUR_MS = 60 * 60 * 1000;

let lastDailyIstDate = "";
let lastWeeklyIstDate = "";
let lastMonthlyYm = "";

/**
 * Daily owner nudge (email), weekly attendance/fees summary, monthly revenue line.
 * Best-effort: skips if email fails.
 */
export function startRetentionJobs() {
  const notifications = container.resolve(NotificationOrchestratorService);

  const runDaily = async () => {
    const today = istDateString();
    if (lastDailyIstDate === today) return;
    lastDailyIstDate = today;
    const centers = await CenterModel.find({ subscriptionStatus: "active", blocked: false }).lean().exec();
    for (const c of centers) {
      const hasStudents =
        (await StudentModel.countDocuments({
          centerId: c._id,
          isDeleted: false,
        })) > 0;
      if (!hasStudents) continue;

      const owner = await UserModel.findOne({
        centerId: c._id,
        role: "center_owner",
      })
        .lean()
        .exec();
      if (!owner?.email) continue;
      await notifications.sendOwnerAttendanceNudgeEmail(c._id.toString(), owner.email, c.name);
    }
  };

  const runWeekly = async () => {
    const today = istDateString();
    if (lastWeeklyIstDate === today) return;
    lastWeeklyIstDate = today;
    const centers = await CenterModel.find({ subscriptionStatus: "active", blocked: false }).lean().exec();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const c of centers) {
      const owner = await UserModel.findOne({
        centerId: c._id,
        role: "center_owner",
      })
        .lean()
        .exec();
      if (!owner?.email) continue;

      const centerOid = c._id as mongoose.Types.ObjectId;
      const marks = await AttendanceModel.countDocuments({
        centerId: centerOid,
        date: { $gte: sevenDaysAgo },
      });
      const paidAgg = await FeeModel.aggregate([
        {
          $match: {
            centerId: centerOid,
            status: "Paid",
            paidDate: { $gte: sevenDaysAgo },
          },
        },
        { $group: { _id: null, t: { $sum: "$amount" } } },
      ]);
      const collected = paidAgg[0]?.t ?? 0;

      await notifications.sendOwnerWeeklySummaryEmail(owner.email, c.name, [
        `Attendance marks saved (7 days): ${marks}`,
        `Fees collected (7 days): ₹${Math.round(collected)}`,
      ]);
    }
  };

  const runMonthly = async () => {
    const { month, year } = istMonthYear();
    const ym = `${year}-${month}`;
    if (ym === lastMonthlyYm) return;
    lastMonthlyYm = ym;
    const centers = await CenterModel.find({ subscriptionStatus: "active", blocked: false }).lean().exec();

    for (const c of centers) {
      const owner = await UserModel.findOne({
        centerId: c._id,
        role: "center_owner",
      })
        .lean()
        .exec();
      if (!owner?.email) continue;

      const centerOid = c._id as mongoose.Types.ObjectId;
      const paidAgg = await FeeModel.aggregate([
        {
          $match: {
            centerId: centerOid,
            status: "Paid",
            month,
            year,
          },
        },
        { $group: { _id: null, t: { $sum: "$amount" } } },
      ]);
      const revenue = paidAgg[0]?.t ?? 0;

      try {
        const { sendTransactionalHtml } = await import("../utils/mail.util");
        await sendTransactionalHtml(
          owner.email,
          `Monthly revenue — ${c.name}`,
          `<p><strong>${c.name}</strong> — ${month}/${year}</p><p>Total fees marked paid: ₹${Math.round(revenue)}</p>`,
          `${c.name} — ${month}/${year}: ₹${Math.round(revenue)} collected (fee records).`
        );
      } catch (e) {
        console.warn("[Retention] monthly email skipped", e);
      }
    }
  };

  const tick = async () => {
    try {
      const hour = istHour();
      const dow = istWeekdayShort();
      const dom = istCalendarDay();

      if (hour === 9) {
        await runDaily();
      }
      if (hour === 10 && dow === "Mon") {
        await runWeekly();
      }
      if (hour === 10 && dom === 1) {
        await runMonthly();
      }
    } catch (e) {
      console.error("[RetentionJobs] tick failed", e);
    }
  };

  console.log("[RetentionJobs] scheduled (hourly)");
  setInterval(tick, HOUR_MS);
  tick().catch((e) => console.error("[RetentionJobs] initial", e));
}
