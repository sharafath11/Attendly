import mongoose from "mongoose";
import { injectable } from "tsyringe";
import { IDashboardService } from "../core/interfaces/services/IDashboardService";
import {
  DashboardDTO,
  DashboardAttendancePointDTO,
  DashboardFeePointDTO,
  DashboardRecentAttendanceDTO,
  DashboardRecentPaymentDTO,
  DashboardUpcomingClassDTO,
} from "../dtos/dashboard/dashboard.dto";
import { AttendanceModel } from "../models/attendance.model";
import { BatchModel } from "../models/batches.model";
import { FeeModel } from "../models/fees.model";
import { StudentModel } from "../models/students.model";
import { MESSAGES } from "../const/messages";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const parseScheduleTime = (value: string): { hours: number; minutes: number } | null => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const rawHours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();
  if (Number.isNaN(rawHours) || Number.isNaN(minutes)) return null;
  let hours = rawHours % 12;
  if (meridian === "PM") hours += 12;
  return { hours, minutes };
};

const normalizeDayLabel = (value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    sun: "Sun",
    sunday: "Sun",
    mon: "Mon",
    monday: "Mon",
    tue: "Tue",
    tues: "Tue",
    tuesday: "Tue",
    wed: "Wed",
    wednesday: "Wed",
    thu: "Thu",
    thur: "Thu",
    thurs: "Thu",
    thursday: "Thu",
    fri: "Fri",
    friday: "Fri",
    sat: "Sat",
    saturday: "Sat",
  };

  return map[normalized] ?? null;
};

const buildMonthKeys = (now: Date, months: number): string[] => {
  const keys: string[] = [];
  const base = new Date(now);
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  for (let i = months - 1; i >= 0; i -= 1) {
    const current = new Date(base);
    current.setMonth(base.getMonth() - i);
    keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
};

const buildWeekKeys = (now: Date, days: number): string[] => {
  const keys: string[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    keys.push(current.toISOString().slice(0, 10));
  }
  return keys;
};

@injectable()
export class DashboardService implements IDashboardService {
  async getDashboard(centerId: string): Promise<DashboardDTO> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const pendingMatch = {
        $and: [
          { $or: [{ centerId: centerObjectId }, { userId: centerObjectId }] },
          {
            $or: [
              { status: "Overdue" },
              {
                status: "Pending",
                $expr: {
                  $or: [
                    { $lt: ["$year", currentYear] },
                    {
                      $and: [
                        { $eq: ["$year", currentYear] },
                        { $lte: ["$month", currentMonth] },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const [
        totalStudents,
        totalBatches,
        todayAttendance,
        pendingFees,
        pendingFeesAmountAgg,
      ] = await Promise.all([
        StudentModel.countDocuments({
          $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
          isDeleted: false,
        }),
        BatchModel.countDocuments({
          $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
        }),
        AttendanceModel.countDocuments({
          centerId: centerObjectId,
          status: "present",
          date: { $gte: startOfToday, $lte: endOfToday },
        }),
        FeeModel.countDocuments(pendingMatch),
        FeeModel.aggregate([
          { $match: pendingMatch },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      const pendingFeesAmount = pendingFeesAmountAgg?.[0]?.total ?? 0;

      const weekKeys = buildWeekKeys(now, 7);
      const attendanceAgg = await AttendanceModel.aggregate([
        {
          $match: {
            centerId: centerObjectId,
            date: { $gte: new Date(weekKeys[0]) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const attendanceMap = new Map<string, number>(
        attendanceAgg.map((item: { _id: string; present: number }) => [item._id, item.present])
      );

      const attendanceChart: DashboardAttendancePointDTO[] = weekKeys.map((key) => {
        const date = new Date(key);
        return {
          day: DAY_LABELS[date.getDay()],
          present: attendanceMap.get(key) ?? 0,
        };
      });

      const monthKeys = buildMonthKeys(now, 6);
      const monthStart = new Date(monthKeys[0] + "-01T00:00:00.000Z");

      const attendanceMonthlyAgg = await AttendanceModel.aggregate([
        {
          $match: {
            centerId: centerObjectId,
            date: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const attendanceMonthMap = new Map<string, number>(
        attendanceMonthlyAgg.map((item: { _id: string; present: number }) => [item._id, item.present])
      );

      const attendanceMonthlyChart: DashboardAttendancePointDTO[] = monthKeys.map((key) => {
        const monthIndex = Number(key.split("-")[1]) - 1;
        return {
          day: MONTH_LABELS[monthIndex] ?? key,
          present: attendanceMonthMap.get(key) ?? 0,
        };
      });

      const feeAgg = await FeeModel.aggregate([
        {
          $match: {
            $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
            status: "Paid",
          },
        },
        {
          $addFields: {
            feeDate: {
              $dateFromParts: { year: "$year", month: "$month", day: 1 },
            },
          },
        },
        {
          $match: {
            feeDate: { $gte: monthStart },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$feeDate" } },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const feeMap = new Map<string, number>(
        feeAgg.map((item: { _id: string; amount: number }) => [item._id, item.amount])
      );

      const feeChart: DashboardFeePointDTO[] = monthKeys.map((key) => {
        const month = Number(key.split("-")[1]);
        return {
          month: MONTH_LABELS[month - 1],
          amount: feeMap.get(key) ?? 0,
        };
      });

      const recentAttendanceRaw = await AttendanceModel.aggregate([
        { $match: { centerId: centerObjectId } },
        { $sort: { date: -1, createdAt: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $lookup: {
            from: "batches",
            localField: "batchId",
            foreignField: "_id",
            as: "batch",
          },
        },
        { $unwind: "$batch" },
        {
          $project: {
            id: { $toString: "$_id" },
            student: "$student.name",
            batch: "$batch.batchName",
            status: "$status",
          },
        },
      ]);

      const recentAttendance: DashboardRecentAttendanceDTO[] = recentAttendanceRaw.map(
        (item: { id: string; student: string; batch: string; status: string }) => ({
          id: item.id,
          student: item.student,
          batch: item.batch,
          status: item.status === "present" ? "Present" : item.status === "leave" ? "Leave" : "Absent",
        })
      );

      const recentPaymentsRaw = await FeeModel.aggregate([
        {
          $match: {
            $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
            status: "Paid",
          },
        },
        { $sort: { paidDate: -1, updatedAt: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $project: {
            id: { $toString: "$_id" },
            student: "$student.name",
            amount: "$amount",
            date: { $ifNull: ["$paidDate", "$updatedAt"] },
          },
        },
      ]);

      const recentPayments: DashboardRecentPaymentDTO[] = recentPaymentsRaw.map(
        (item: { id: string; student: string; amount: number; date?: Date }) => ({
          id: item.id,
          student: item.student,
          amount: item.amount ?? 0,
          date: item.date ? new Date(item.date).toISOString() : now.toISOString(),
        })
      );

      const batches = await BatchModel.find({
        $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
      })
        .select({ batchName: 1, classLevel: 1, scheduleTime: 1, days: 1 })
        .lean()
        .exec();

      const upcomingCandidates: Array<{ id: string; name: string; time: string; sortDate: Date }> = [];
      const maxAheadMs = 48 * 60 * 60 * 1000;
      const nowMs = now.getTime();

      batches.forEach((batch) => {
        const parsed = parseScheduleTime(batch.scheduleTime);
        if (!parsed || !Array.isArray(batch.days)) return;
        batch.days.forEach((day) => {
          const normalizedDay = normalizeDayLabel(day);
          if (!normalizedDay) return;
          const dayIndex = DAY_LABELS.indexOf(normalizedDay as (typeof DAY_LABELS)[number]);
          if (dayIndex < 0) return;
          const target = new Date(now);
          const diff = (dayIndex - target.getDay() + 7) % 7;
          target.setDate(target.getDate() + diff);
          target.setHours(parsed.hours, parsed.minutes, 0, 0);
          if (diff === 0 && target.getTime() <= nowMs) {
            target.setDate(target.getDate() + 7);
          }
          if (target.getTime() - nowMs <= maxAheadMs) {
            const dayDiff = Math.floor((target.getTime() - nowMs) / (24 * 60 * 60 * 1000));
            const dayLabel = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : DAY_LABELS[target.getDay()];
            upcomingCandidates.push({
              id: batch._id.toString(),
              name: `${batch.classLevel} - ${batch.batchName}`,
              time: `${dayLabel}, ${batch.scheduleTime}`,
              sortDate: target,
            });
          }
        });
      });

      const upcomingClasses: DashboardUpcomingClassDTO[] = upcomingCandidates
        .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
        .slice(0, 3)
        .map((item, index) => ({
          id: `${item.id}-${index}`,
          name: item.name,
          time: item.time,
        }));

      return {
        summary: {
          totalStudents,
          todayAttendance,
          pendingFees,
          pendingFeesAmount,
          totalBatches,
        },
        attendanceChart,
        attendanceMonthlyChart,
        feeChart,
        recentAttendance,
        recentPayments,
        upcomingClasses,
      };
    } catch (error) {
      throw new Error(MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
