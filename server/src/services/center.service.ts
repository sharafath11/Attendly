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
import { redis } from "../utils/redis";
import { generateOtp, OTP_TTL_SECONDS, storeOtp, verifyOtp } from "../utils/otp.util";
import { sendEmailOtp } from "../utils/mail.util";

const CENTER_REGISTRATION_TTL_SECONDS = 10 * 60;

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

  private async ensureEmailAvailable(email: string): Promise<void> {
    const existingUser = await UserModel.findOne({ email }).lean().exec();
    if (existingUser) {
      throwError("Email already registered", StatusCode.BAD_REQUEST);
    }

    const existingCenter = await this._centerRepository.findOne({ email });
    if (existingCenter) {
      throwError("Center email already registered", StatusCode.BAD_REQUEST);
    }
  }

  private async createCenterFromRegistration(payload: CenterRegistrationDTO & { hashedPassword: string }): Promise<void> {
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

    await UserModel.create({
      _id: centerId as any,
      username: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      password: payload.hashedPassword,
      role: "center_owner",
      centerId: centerId.toString(),
      status: "pending",
      isVerified: true,
    });
  }

  async registerCenter(payload: CenterRegistrationDTO): Promise<void> {
    await this.requestCenterRegistrationOtp(payload);
  }

  async requestCenterRegistrationOtp(payload: CenterRegistrationDTO): Promise<void> {
    await this.ensureEmailAvailable(payload.email);

    if (!["basic", "pro"].includes(payload.planType)) {
      throwError("Invalid planType", StatusCode.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const registrationKey = `center:register:${payload.email}`;
    await redis.set(
      registrationKey,
      JSON.stringify({ ...payload, hashedPassword }),
      "EX",
      CENTER_REGISTRATION_TTL_SECONDS
    );

    const otp = generateOtp();
    await storeOtp("register", payload.email, otp);
    await sendEmailOtp(payload.email, otp);
  }

  async verifyCenterRegistrationOtp(email: string, otp: string): Promise<void> {
    const isValid = await verifyOtp("register", email, otp);
    if (!isValid) {
      throwError("Invalid or expired OTP", StatusCode.BAD_REQUEST);
    }

    const registrationKey = `center:register:${email}`;
    const stored = await redis.get(registrationKey);
    if (!stored) {
      throwError("Registration session expired. Please register again.", StatusCode.BAD_REQUEST);
    }

    await this.ensureEmailAvailable(email);

    const payload = JSON.parse(stored) as CenterRegistrationDTO & { hashedPassword: string };
    await this.createCenterFromRegistration(payload);
    await redis.del(registrationKey);
  }

  async resendCenterRegistrationOtp(email: string): Promise<void> {
    const registrationKey = `center:register:${email}`;
    const stored = await redis.get(registrationKey);
    if (!stored) {
      throwError("Registration session expired. Please register again.", StatusCode.BAD_REQUEST);
    }
    const otp = generateOtp();
    await storeOtp("register", email, otp);
    await sendEmailOtp(email, otp);
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
