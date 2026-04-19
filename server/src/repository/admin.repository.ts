import mongoose from "mongoose";
import { AdminRepositoryData } from "../types/adminTypes";
import { BaseRepository } from "./baseRepository";
import { CenterDocument, CenterModel, ICenter } from "../models/center.model";
import { StudentModel } from "../models/students.model";
import { UserModel } from "../models/user.Model";
import { MESSAGES } from "../const/messages";
import { IAdminRepository } from "../core/interfaces/repository/IAdminRepository";
import { NotificationModel } from "../models/notification.model";
import { AttendanceModel } from "../models/attendance.model";
import { PaymentTransactionModel } from "../models/paymentTransaction.model";
import { ActivityLogModel } from "../models/activityLog.model";
import {
  AdminLogsDTO,
  AdminPlatformMetricsDTO,
  AdminRevenueDTO,
  AdminUserRowDTO,
} from "../dtos/admin/admin.dto";

export class AdminRepository
  extends BaseRepository<CenterDocument, ICenter>
  implements IAdminRepository
{
  constructor() {
    super(CenterModel);
  }

  async getDashboardStats(): Promise<AdminRepositoryData> {
    try {
      const [totalCenters, activeCenters, blockedCenters, pendingCenters, totalStudents, totalTeachers, revenueAgg] =
        await Promise.all([
          CenterModel.countDocuments({}),
          CenterModel.countDocuments({ subscriptionStatus: "active" }),
          CenterModel.countDocuments({ subscriptionStatus: "blocked" }),
          CenterModel.countDocuments({ subscriptionStatus: "pending_payment" }),
          StudentModel.countDocuments({ isDeleted: false }),
          UserModel.countDocuments({ role: "teacher" }),
          CenterModel.aggregate([
            { $match: { subscriptionStatus: "active", monthlyFee: { $ne: null } } },
            { $group: { _id: null, total: { $sum: "$monthlyFee" } } },
          ]),
        ]);

      const monthlyRevenue = revenueAgg?.[0]?.total ?? 0;

      return {
        totalCenters,
        activeCenters,
        blockedCenters,
        pendingCenters,
        totalStudents,
        totalTeachers,
        monthlyRevenue,
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async getPlatformAnalytics(): Promise<AdminPlatformMetricsDTO> {
    try {
      const base = await this.getDashboardStats();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalParents,
        totalCenterOwners,
        whatsappSent30d,
        whatsappFailed30d,
        feeRemindersSent30d,
        attendanceMarks30d,
        platformPaymentAgg,
        topCenters,
        dauIds,
        recentActiveCenterIds,
        activePayingCenters,
        pendingOrExpiredCount,
        notificationFailures24h,
      ] = await Promise.all([
        UserModel.countDocuments({ role: "parent" }),
        UserModel.countDocuments({ role: "center_owner" }),
        NotificationModel.countDocuments({
          channel: "whatsapp",
          status: "sent",
          createdAt: { $gte: thirtyDaysAgo },
        }),
        NotificationModel.countDocuments({
          channel: "whatsapp",
          status: "failed",
          createdAt: { $gte: thirtyDaysAgo },
        }),
        NotificationModel.countDocuments({
          type: "fee_reminder",
          status: "sent",
          createdAt: { $gte: thirtyDaysAgo },
        }),
        AttendanceModel.countDocuments({ date: { $gte: thirtyDaysAgo } }),
        PaymentTransactionModel.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, totalPaise: { $sum: "$amountPaise" } } },
        ]),
        PaymentTransactionModel.aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: "$centerId", totalPaise: { $sum: "$amountPaise" } } },
          { $sort: { totalPaise: -1 } },
          { $limit: 8 },
          {
            $lookup: {
              from: "centers",
              localField: "_id",
              foreignField: "_id",
              as: "c",
            },
          },
          { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              centerId: { $toString: "$_id" },
              centerName: { $ifNull: ["$c.name", "Unknown"] },
              totalInr: { $divide: ["$totalPaise", 100] },
            },
          },
        ]),
        ActivityLogModel.distinct("actorUserId", { createdAt: { $gte: startOfToday } }),
        ActivityLogModel.distinct("centerId", { createdAt: { $gte: sevenDaysAgo } }),
        CenterModel.find({ subscriptionStatus: "active", blocked: false }).select("_id").lean().exec(),
        CenterModel.countDocuments({ subscriptionStatus: { $in: ["pending_payment", "expired"] } }),
        NotificationModel.countDocuments({ status: "failed", createdAt: { $gte: dayAgo } }),
      ]);

      const platformPaymentsCollectedInr = (platformPaymentAgg[0]?.totalPaise ?? 0) / 100;

      const recentSet = new Set(recentActiveCenterIds.map((id) => id.toString()));
      const inactiveCenters7d = activePayingCenters.filter((c) => !recentSet.has(c._id.toString())).length;
      const atRiskCentersApprox = inactiveCenters7d + pendingOrExpiredCount;

      return {
        ...base,
        totalParents,
        totalCenterOwners,
        whatsappSent30d,
        whatsappFailed30d,
        feeRemindersSent30d,
        attendanceMarks30d,
        platformPaymentsCollectedInr,
        dailyActiveUsersApprox: dauIds.length,
        topCentersByPlatformPayments: topCenters as AdminPlatformMetricsDTO["topCentersByPlatformPayments"],
        inactiveCenters7d,
        atRiskCentersApprox,
        notificationFailures24h,
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async getRevenueSnapshot(): Promise<AdminRevenueDTO> {
    try {
      const base = await this.getDashboardStats();
      const [platformPaymentAgg, activeSubscriptionCenters, pendingPaymentCenters, expiredCenters, blockedCentersCount] =
        await Promise.all([
          PaymentTransactionModel.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, totalPaise: { $sum: "$amountPaise" } } },
          ]),
          CenterModel.countDocuments({ subscriptionStatus: "active" }),
          CenterModel.countDocuments({ subscriptionStatus: "pending_payment" }),
          CenterModel.countDocuments({ subscriptionStatus: "expired" }),
          CenterModel.countDocuments({ subscriptionStatus: "blocked" }),
        ]);

      const platformPaymentsCollectedInr = (platformPaymentAgg[0]?.totalPaise ?? 0) / 100;

      return {
        monthlyRecurringRevenue: base.monthlyRevenue,
        platformPaymentsCollectedInr,
        activeSubscriptionCenters,
        pendingPaymentCenters,
        expiredCenters,
        blockedCentersCount,
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async listUsersForAdmin(role?: string): Promise<AdminUserRowDTO[]> {
    try {
      const allowed = ["center_owner", "teacher", "parent", "super_admin"] as const;
      const filter =
        role && (allowed as readonly string[]).includes(role) ? { role: role as (typeof allowed)[number] } : {};
      const users = await UserModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(500)
        .select("email username role phone centerId status createdAt")
        .lean()
        .exec();

      return users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        username: u.username,
        role: u.role ?? "center_owner",
        phone: u.phone,
        centerId: u.centerId ? u.centerId.toString() : null,
        status: u.status ?? "pending",
        createdAt: (u.createdAt ?? new Date()).toISOString(),
      }));
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async getAdminLogs(): Promise<AdminLogsDTO> {
    try {
      const [activities, whatsappFailures] = await Promise.all([
        ActivityLogModel.find({})
          .sort({ createdAt: -1 })
          .limit(80)
          .lean()
          .exec(),
        NotificationModel.find({ status: "failed", channel: "whatsapp" })
          .sort({ createdAt: -1 })
          .limit(40)
          .lean()
          .exec(),
      ]);

      return {
        activities: activities.map((a) => ({
          id: a._id.toString(),
          centerId: a.centerId.toString(),
          action: a.action,
          summary: a.summary,
          createdAt: (a.createdAt ?? new Date()).toISOString(),
        })),
        whatsappFailures: whatsappFailures.map((n) => ({
          id: n._id.toString(),
          centerId: n.centerId.toString(),
          type: n.type,
          error: n.error,
          createdAt: (n.createdAt ?? new Date()).toISOString(),
        })),
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async getCenterOwner(
    centerId: string
  ): Promise<{ id: string; name: string; email: string; isVerified: boolean; status: "active" | "pending" | "disabled" } | null> {
    try {
      const owner = await UserModel.findById(centerId).lean().exec();
      if (!owner) {
        return null;
      }
      return {
        id: owner._id.toString(),
        name: owner.username,
        email: owner.email,
        isVerified: owner.isVerified ?? false,
        status: (owner.status as "active" | "pending" | "disabled") ?? "pending",
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ONE_ERROR);
    }
  }

  async getTeachersCount(centerId: string): Promise<number> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      return await UserModel.countDocuments({
        role: "teacher",
        $or: [{ centerId: centerId }, { centerId: centerObjectId }],
      });
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.COUNT_ERROR);
    }
  }

  async getStudentsCount(centerId: string): Promise<number> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      return await StudentModel.countDocuments({
        $or: [{ centerId: centerObjectId }, { userId: centerId }],
        isDeleted: false,
      });
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.COUNT_ERROR);
    }
  }
}
