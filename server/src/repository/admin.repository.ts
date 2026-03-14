import mongoose from "mongoose";
import { AdminRepositoryData } from "../types/adminTypes";
import { BaseRepository } from "./baseRepository";
import { CenterDocument, CenterModel, ICenter } from "../models/center.model";
import { StudentModel } from "../models/students.model";
import { UserModel } from "../models/user.Model";
import { MESSAGES } from "../const/messages";
import { IAdminRepository } from "../core/interfaces/repository/IAdminRepository";

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

  async getCenterOwner(centerId: string): Promise<{ id: string; name: string; email: string; isVerified: boolean } | null> {
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
