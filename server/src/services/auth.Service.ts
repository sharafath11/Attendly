import { inject, injectable } from "tsyringe";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { IAuthService } from "../core/interfaces/services/IAuthService";
import { IAuthRepository } from "../core/interfaces/repository/IAuthRepository";
import { TYPES } from "../core/types";
import { throwError } from "../utils/response";
import { MESSAGES } from "../const/messages";
import { UserResponseMapper } from "../dtos/user/userResponseMapper";
import { IUserDto, IUserLoginDTO } from "../dtos/user/IUserDto";
import { StatusCode } from "../enums/statusCode";

import { generateAccessToken, generateRefreshToken } from "../lib/jwtToken";
import { generateOtp, OTP_TTL_SECONDS } from "../utils/otp.util";
import { redis } from "../utils/redis";
import { sendEmailOtp } from "../utils/mail.util";
import { CenterModel } from "../models/center.model";
import { IUser } from "../types/userTypes";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IAuthRepository)
    private  _authRepo: IAuthRepository
  ) {}

  private async ensureCenterForOwner(user: IUser): Promise<void> {
    const role = user.role ?? "center_owner";
    if (role !== "center_owner") return;

    const centerId = user._id.toString();
    const existingCenter = await CenterModel.findById(centerId).lean().exec();
    if (existingCenter) return;

    await CenterModel.create({
      _id: user._id,
      name: user.username,
      email: user.email,
      phone: user.phone,
      blocked: false,
    });
  }

  private async ensureCenterNotBlocked(user: IUser): Promise<void> {
    const role = user.role ?? "center_owner";
    if (role !== "center_owner" && role !== "teacher") return;

    const centerId = (user.centerId ?? user._id.toString()).toString();
    let center = await CenterModel.findById(centerId).lean().exec();
    if (!center) {
      const owner = await this._authRepo.findById(centerId);
      if (owner) {
        await CenterModel.create({
          _id: owner._id,
          name: owner.username,
          email: owner.email,
          phone: owner.phone,
          blocked: false,
        });
        center = await CenterModel.findById(centerId).lean().exec();
      }
    }
    if (center?.blocked || center?.subscriptionStatus === "blocked") {
      throwError("Your center has been blocked by admin", StatusCode.FORBIDDEN);
    }
  }

  async login(identifier: string, password: string): Promise<IUserLoginDTO> {
    const user =
      (await this._authRepo.findOne({ email: identifier })) ??
      (await this._authRepo.findOne({ username: identifier }));
    if (!user) throwError(MESSAGES.AUTH.NOT_FOUND);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throwError(MESSAGES.AUTH.INVALID_CREDENTIALS);

    if (!user.isVerified) throwError(MESSAGES.AUTH.AUTH_REQUIRED);
    if (user.status === "disabled") throwError(MESSAGES.AUTH.BLOCKED);
    if (user.status && user.status !== "active") throwError("Account not approved yet.", StatusCode.FORBIDDEN);
    await this.ensureCenterNotBlocked(user);

    const rawRole = (user.role ?? "center_owner") as string;
    const role = rawRole === "owner" ? "center_owner" : (rawRole as "center_owner" | "teacher" | "super_admin");
    const centerId = (user.centerId ?? user._id.toString()).toString();
    if (!user.role || rawRole === "owner") {
      await this._authRepo.update(user._id as unknown as string, { role: "center_owner" });
    }
    const token = generateAccessToken(user._id as unknown as string, role, centerId);
    const refreshToken = generateRefreshToken(user._id as unknown as string, role, centerId);
    return UserResponseMapper.toLoginUserResponse(user,token,refreshToken);
  }

async signup(data: { name: string; email: string; password: string }):Promise<void> {
  const existingUser = await this._authRepo.findOne({ email: data.email });
  if (existingUser?.isVerified) {
    throwError(MESSAGES.AUTH.USER_ALREADY_EXISTS);
  }
  let user;
  const hashedPassword = await bcrypt.hash(data.password, 10);
  if (existingUser && !existingUser.isVerified) {
    user = existingUser;
    await this._authRepo.update(user._id as unknown as string, {
      username: data.name,
      password: hashedPassword,
      role: user.role ?? "center_owner",
      status: user.status ?? "active",
    });
  } 
  else {
    user = await this._authRepo.create({
      username: data.name,
      email: data.email,
      password: hashedPassword,
      isVerified: false,
      role: "center_owner",
      status: "active",
    });
  }

  if (!user) {
    throwError(MESSAGES.COMMON.SERVER_ERROR);
  }

  if (!user.centerId) {
    await this._authRepo.update(user._id as unknown as string, {
      centerId: user._id.toString(),
    });
    user.centerId = user._id.toString();
  }

  await this.ensureCenterForOwner(user);

  const otp = generateOtp();
  const redisKey = `otp:register:${user._id}`;
  const existingOtp = await redis.get(redisKey);
  if (existingOtp) {
    throwError(MESSAGES.AUTH.OTP_ALREADY_SENT);
  }

  await redis.set(redisKey, otp, "EX", OTP_TTL_SECONDS);
  await sendEmailOtp(user.email, otp);

}


  async verifyOtp(email: string, otp: string): Promise<void> {
    const user = await this._authRepo.findOne({ email });
    if (!user) throwError(MESSAGES.AUTH.NOT_FOUND);
    
    const redisKey = `otp:register:${user._id}`;
    const storedOtp = await redis.get(redisKey);
    
    if (!storedOtp) throwError(MESSAGES.AUTH.OTP_EXPIRED);
    if (storedOtp !== otp) throwError(MESSAGES.AUTH.INVALID_OTP);
    
    await this._authRepo.update(user._id as unknown as string, {
      isVerified: true,
    });
    
    await redis.del(redisKey);
  }

  async resendOtp(email: string): Promise<void> {
    const user = await this._authRepo.findOne({ email });
    if (!user) throwError(MESSAGES.AUTH.NOT_FOUND);
    if (user.isVerified) throwError(MESSAGES.AUTH.ALREADY_REGISTERED);
    
    const otp = generateOtp();
    const redisKey = `otp:register:${email}`;
    
    await redis.set(redisKey, otp, "EX", OTP_TTL_SECONDS);
    await sendEmailOtp(user.email, otp);
  }

  async getUser(id: string): Promise<IUserDto> {
    const user = await this._authRepo.findById(id);
    if (!user) throwError(MESSAGES.COMMON.SERVER_ERROR);
    return  UserResponseMapper.toUserResponse(user)
  }

  async googleAuth(googleToken: string): Promise<IUserLoginDTO> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) throwError("Google Client ID not configured");

      const client = new OAuth2Client(clientId);
      
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throwError(MESSAGES.AUTH.INVALID_TOKEN);
      }

      const email = payload.email;
      const name = payload.name || email.split("@")[0];

      let user = await this._authRepo.findOne({ email });

      if (user) {
        if (user.status === "disabled") throwError(MESSAGES.AUTH.BLOCKED);
        if (user.status && user.status !== "active") throwError("Account not approved yet.", StatusCode.FORBIDDEN);
        await this.ensureCenterNotBlocked(user);
    const role = user.role ?? "center_owner";
        const centerId = (user.centerId ?? user._id.toString()).toString();
        const token = generateAccessToken(user._id as unknown as string, role, centerId);
        const refreshToken = generateRefreshToken(user._id as unknown as string, role, centerId);
        return UserResponseMapper.toLoginUserResponse(user, token, refreshToken);
      }

      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await this._authRepo.create({
        username: name,
        email: email,
        password: randomPassword,
        isVerified: true,
        authProvider: "google",
        role: "center_owner",
        status: "active",
      });

      if (!user) throwError(MESSAGES.AUTH.USER_UPDATE_FAILED);

      if (!user.centerId) {
        await this._authRepo.update(user._id as unknown as string, {
          centerId: user._id.toString(),
        });
        user.centerId = user._id.toString();
      }

      await this.ensureCenterForOwner(user);

      const centerId = (user.centerId ?? user._id.toString()).toString();
      const token = generateAccessToken(user._id as unknown as string, "center_owner", centerId);
      const refreshToken = generateRefreshToken(user._id as unknown as string, "center_owner", centerId);
      return UserResponseMapper.toLoginUserResponse(user, token, refreshToken);
    } catch (error: any) {
      if (error.message && !error.message.includes("Google")) {
        throw error;
      }
      throwError(MESSAGES.AUTH.INVALID_GOOGLE_CREDENTIALS);
    }
  }
}
