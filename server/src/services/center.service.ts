import { inject, injectable } from "tsyringe";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { ICenterService } from "../core/interfaces/services/ICenterService";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import { CenterRegistrationDTO } from "../dtos/centers/centerRegistration.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { UserModel } from "../models/user.Model";

@injectable()
export class CenterService implements ICenterService {
  constructor(
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
  ) {}

  private getPlanLimits(planType: "basic" | "pro") {
    if (planType === "basic") {
      return { teacherLimit: 5, studentLimit: 150, monthlyFee: 199, planName: "Basic Plan" };
    }
    return { teacherLimit: 10, studentLimit: 400, monthlyFee: 299, planName: "Pro Plan" };
  }

  async registerCenter(payload: CenterRegistrationDTO): Promise<void> {
    const existingUser = await UserModel.findOne({ email: payload.email }).lean().exec();
    if (existingUser) {
      throwError("Email already registered", StatusCode.BAD_REQUEST);
    }

    const existingCenter = await this._centerRepository.findOne({ email: payload.email });
    if (existingCenter) {
      throwError("Center email already registered", StatusCode.BAD_REQUEST);
    }

    if (!["basic", "pro"].includes(payload.planType)) {
      throwError("Invalid planType", StatusCode.BAD_REQUEST);
    }

    const { teacherLimit, studentLimit, monthlyFee, planName } = this.getPlanLimits(payload.planType);
    const centerId = new mongoose.Types.ObjectId();

    await this._centerRepository.create({
      _id: centerId,
      name: payload.centerName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      medium: payload.medium,
      status: "pending",
      planType: payload.planType,
      teacherLimit,
      studentLimit,
      planName,
      monthlyFee,
      subscriptionStatus: "pending_payment",
      blocked: false,
    });

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    await UserModel.create({
      _id: centerId as any,
      username: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      role: "center_owner",
      centerId: centerId.toString(),
      status: "pending",
      isVerified: true,
    });
  }

  async getCenterStatus(centerId: string): Promise<{ subscriptionStatus: string }> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    return { subscriptionStatus: center.subscriptionStatus };
  }

  async getMyCenter(centerId: string): Promise<{
    subscriptionStatus: string;
    subscriptionStartDate?: Date | null;
    subscriptionEndDate?: Date | null;
    planType?: string | null;
    blocked?: boolean;
    blockedReason?: string | null;
  }> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    return {
      subscriptionStatus: center.subscriptionStatus,
      subscriptionStartDate: center.subscriptionStartDate ?? null,
      subscriptionEndDate: center.subscriptionEndDate ?? null,
      planType: center.planType ?? null,
      blocked: center.blocked,
      blockedReason: center.blockedReason ?? null,
    };
  }
}
