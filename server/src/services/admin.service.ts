import { inject, injectable } from "tsyringe";
import { IAdminService } from "../core/interfaces/services/IAdminService";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { IAdminRepository } from "../core/interfaces/repository/IAdminRepository";
import { TYPES } from "../core/types";
import {
  AdminDashboardChartsDTO,
  AdminDashboardDTO,
  BlockCenterDTO,
  UpdatePaymentStatusDTO,
  UpdateUserStatusDTO,
} from "../dtos/admin/admin.dto";
import { CenterResponseDTO } from "../dtos/centers/centers.dto";
import { CenterModel, ICenter } from "../models/center.model";
import { UserModel } from "../models/user.Model";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository,
    @inject(TYPES.IAdminRepository)
    private _adminRepository: IAdminRepository
  ) {}

  private mapCenter(center: ICenter): CenterResponseDTO {
    return {
      id: center._id.toString(),
      name: center.name,
      email: center.email,
      phone: center.phone,
      address: center.address,
      medium: center.medium,
      status: center.status,
      planType: center.planType,
      teacherLimit: center.teacherLimit,
      studentLimit: center.studentLimit,
      subscriptionStatus: center.subscriptionStatus,
      subscriptionStartDate: center.subscriptionStartDate ?? null,
      subscriptionEndDate: center.subscriptionEndDate ?? null,
      blocked: center.blocked,
      blockedReason: center.blockedReason ?? null,
      blockedAt: center.blockedAt ?? null,
      planName: center.planName ?? null,
      monthlyFee: center.monthlyFee ?? null,
      lastPaymentDate: center.lastPaymentDate ?? null,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
    };
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throwError("Invalid date", StatusCode.BAD_REQUEST);
    }
    return parsed;
  }

  private async ensureCenterExists(centerId: string): Promise<ICenter> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    return center;
  }

  async getDashboard(): Promise<AdminDashboardDTO> {
    const now = new Date();
    await this._centerRepository.updateMany(
      {
        subscriptionEndDate: { $lt: now },
        subscriptionStatus: { $ne: "blocked" },
      },
      { subscriptionStatus: "blocked", blocked: true, blockedReason: "Subscription expired", blockedAt: now }
    );

    return this._adminRepository.getDashboardStats();
  }

  async getDashboardCharts(): Promise<AdminDashboardChartsDTO> {
    const now = new Date();
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 5);

    const buildMonthKeys = () => {
      const keys: string[] = [];
      const base = new Date(now);
      base.setDate(1);
      base.setHours(0, 0, 0, 0);
      for (let i = 5; i >= 0; i -= 1) {
        const current = new Date(base);
        current.setMonth(base.getMonth() - i);
        keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
      }
      return keys;
    };

    const monthKeys = buildMonthKeys();

    const revenueAgg = await CenterModel.aggregate([
      {
        $match: {
          monthlyFee: { $ne: null },
          lastPaymentDate: { $ne: null },
        },
      },
      { $match: { lastPaymentDate: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$lastPaymentDate" } },
          revenue: { $sum: "$monthlyFee" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueMap = new Map<string, number>(
      revenueAgg.map((item: { _id: string; revenue: number }) => [item._id, item.revenue])
    );

    const centersAgg = await CenterModel.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          centers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const centersMap = new Map<string, number>(
      centersAgg.map((item: { _id: string; centers: number }) => [item._id, item.centers])
    );

    return {
      revenueByMonth: monthKeys.map((key) => {
        const monthIndex = Number(key.split("-")[1]) - 1;
        return {
          month: monthLabels[monthIndex] ?? key,
          revenue: revenueMap.get(key) ?? 0,
        };
      }),
      centersGrowth: monthKeys.map((key) => {
        const monthIndex = Number(key.split("-")[1]) - 1;
        return {
          month: monthLabels[monthIndex] ?? key,
          centers: centersMap.get(key) ?? 0,
        };
      }),
    };
  }

  async listCenters(): Promise<(CenterResponseDTO & { owner?: { id: string; name: string; email: string; isVerified: boolean } })[]> {
    const centers = await this._centerRepository.findMany({});
    const mapped = await Promise.all(
      centers.map(async (center) => {
        const owner = await this._adminRepository.getCenterOwner(center._id.toString());
        return {
          ...this.mapCenter(center),
          owner: owner ?? undefined,
        };
      })
    );
    return mapped;
  }

  async getCenterById(
    centerId: string
  ): Promise<
    CenterResponseDTO & { owner?: { id: string; name: string; email: string; isVerified: boolean }; totalStudents: number; totalTeachers: number }
  > {
    const center = await this.ensureCenterExists(centerId);
    const [owner, totalStudents, totalTeachers] = await Promise.all([
      this._adminRepository.getCenterOwner(centerId),
      this._adminRepository.getStudentsCount(centerId),
      this._adminRepository.getTeachersCount(centerId),
    ]);

    return {
      ...this.mapCenter(center),
      owner: owner ?? undefined,
      totalStudents,
      totalTeachers,
    };
  }

  async blockCenter(centerId: string, payload: BlockCenterDTO): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);
    const reason = payload.blockedReason ?? payload.reason ?? "Blocked by admin";

    const updated = await this._centerRepository.update(centerId, {
      blocked: true,
      subscriptionStatus: "blocked",
      blockedReason: reason,
      blockedAt: new Date(),
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapCenter(updated);
  }

  async unblockCenter(centerId: string): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const updated = await this._centerRepository.update(centerId, {
      blocked: false,
      subscriptionStatus: "active",
      blockedReason: null,
      blockedAt: null,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapCenter(updated);
  }

  async updatePaymentStatus(centerId: string, payload: UpdatePaymentStatusDTO): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const nextStatus = payload.subscriptionStatus;
    const updatePayload: Record<string, unknown> = {
      subscriptionStatus: nextStatus,
      lastPaymentDate: this.parseDate(payload.lastPaymentDate),
      subscriptionStartDate: this.parseDate(payload.subscriptionStartDate),
      subscriptionEndDate: this.parseDate(payload.subscriptionEndDate),
    };

    if (nextStatus === "blocked") {
      updatePayload.blocked = true;
      updatePayload.blockedAt = new Date();
    } else {
      updatePayload.blocked = false;
      updatePayload.blockedReason = null;
      updatePayload.blockedAt = null;
    }

    const updated = await this._centerRepository.update(centerId, updatePayload);
    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapCenter(updated);
  }

  async verifyCenter(centerId: string): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const updated = await this._centerRepository.update(centerId, {
      status: "verified",
      subscriptionStatus: "active",
      subscriptionStartDate: today,
      subscriptionEndDate: endDate,
      blocked: false,
      blockedReason: null,
      blockedAt: null,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    await UserModel.findByIdAndUpdate(centerId, { status: "active" }).lean().exec();

    return this.mapCenter(updated);
  }

  async rejectCenter(centerId: string): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const updated = await this._centerRepository.update(centerId, {
      status: "rejected",
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapCenter(updated);
  }

  async verifySubscriptionPayment(centerId: string): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const updated = await this._centerRepository.update(centerId, {
      subscriptionStatus: "active",
      subscriptionStartDate: today,
      subscriptionEndDate: endDate,
      blocked: false,
      blockedReason: null,
      blockedAt: null,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    await UserModel.findByIdAndUpdate(centerId, { status: "active" }).lean().exec();

    return this.mapCenter(updated);
  }

  async rejectSubscriptionPayment(centerId: string): Promise<CenterResponseDTO> {
    await this.ensureCenterExists(centerId);

    const updated = await this._centerRepository.update(centerId, {
      subscriptionStatus: "pending_payment",
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapCenter(updated);
  }

  async verifyUser(userId: string): Promise<{ id: string; isVerified: boolean }> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) {
      throwError("User not found", StatusCode.NOT_FOUND);
    }

    return { id: updated._id.toString(), isVerified: updated.isVerified ?? false };
  }

  async unverifyUser(userId: string): Promise<{ id: string; isVerified: boolean }> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { isVerified: false },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) {
      throwError("User not found", StatusCode.NOT_FOUND);
    }

    return { id: updated._id.toString(), isVerified: updated.isVerified ?? false };
  }

  async updateUserStatus(userId: string, payload: UpdateUserStatusDTO): Promise<{ id: string; status: string }> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { status: payload.status },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) {
      throwError("User not found", StatusCode.NOT_FOUND);
    }

    return { id: updated._id.toString(), status: updated.status ?? "pending" };
  }
}
