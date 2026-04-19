import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { injectable } from "tsyringe";
import mongoose from "mongoose";
import { redis } from "../utils/redis";
import { generateOtp, OTP_TTL_SECONDS } from "../utils/otp.util";
import { normalizePhoneDigits } from "../utils/phone.util";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { UserModel } from "../models/user.Model";
import { StudentModel } from "../models/students.model";
import { CenterModel } from "../models/center.model";
import { sendWhatsAppMessage } from "./whatsapp.service";
import { generateAccessToken, generateRefreshToken } from "../lib/jwtToken";

const OTP_PREFIX = "otp:parent:";

function matchesParentPhone(stored: string | undefined, digits: string): boolean {
  if (!stored) return false;
  return normalizePhoneDigits(stored) === digits;
}

@injectable()
export class ParentAuthService {
  async requestOtp(phoneRaw: string, centerIdHint?: string) {
    const digits = normalizePhoneDigits(phoneRaw);
    if (digits.length < 10) {
      throwError("Enter a valid 10-digit mobile number.", StatusCode.BAD_REQUEST);
    }

    const all = await StudentModel.find({ isDeleted: false }).select("parentPhone centerId name").lean().exec();
    const linked = all.filter((s) => matchesParentPhone(s.parentPhone, digits));
    if (linked.length === 0) {
      throwError(
        "No student is linked to this number yet. Ask your center to add your number as the parent phone.",
        StatusCode.NOT_FOUND
      );
    }

    const centerIds = [...new Set(linked.map((s) => s.centerId.toString()))];
    let centerId = centerIdHint;

    if (centerIds.length > 1) {
      if (!centerId || !centerIds.includes(centerId)) {
        const centers = await CenterModel.find({ _id: { $in: centerIds.map((id) => new mongoose.Types.ObjectId(id)) } })
          .select("name")
          .lean()
          .exec();
        return {
          needsCenterPick: true as const,
          centers: centers.map((c) => ({ id: c._id.toString(), name: c.name })),
        };
      }
    } else {
      centerId = centerIds[0];
    }

    if (!centerId) {
      throwError("Center could not be determined.", StatusCode.BAD_REQUEST);
    }

    const otp = generateOtp();
    const key = `${OTP_PREFIX}${digits}`;
    const existing = await redis.get(key);
    if (existing) {
      throwError("OTP already sent. Please wait before requesting again.", StatusCode.BAD_REQUEST);
    }
    await redis.set(key, otp, "EX", OTP_TTL_SECONDS);

    const msg = `Your Attendly parent login code is ${otp}. It expires in a few minutes. Do not share this code.`;
    const wa = await sendWhatsAppMessage(digits, msg);

    if (!wa.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Parent OTP] WhatsApp failed (${wa.error}). OTP for ${digits}: ${otp}`);
      } else {
        throwError(
          "Could not send WhatsApp (check Twilio / 360dialog configuration).",
          StatusCode.SERVICE_UNAVAILABLE
        );
      }
    }

    return {
      needsCenterPick: false as const,
      centerId,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  async verifyOtp(phoneRaw: string, otp: string, centerIdHint?: string) {
    const digits = normalizePhoneDigits(phoneRaw);
    const key = `${OTP_PREFIX}${digits}`;
    const stored = await redis.get(key);
    if (!stored || stored !== otp) {
      throwError("Invalid or expired code.", StatusCode.BAD_REQUEST);
    }

    const all = await StudentModel.find({ isDeleted: false }).lean().exec();
    const linked = all.filter((s) => matchesParentPhone(s.parentPhone, digits));
    if (!linked.length) {
      throwError("Access denied.", StatusCode.FORBIDDEN);
    }

    const centerIds = [...new Set(linked.map((s) => s.centerId.toString()))];
    let centerId = centerIdHint ?? centerIds[0];
    if (centerIds.length > 1) {
      if (!centerIdHint || !centerIds.includes(centerIdHint)) {
        throwError("Please specify which center you are logging into.", StatusCode.BAD_REQUEST);
      }
      centerId = centerIdHint;
    }

    await redis.del(key);

    const center = await CenterModel.findById(centerId).lean().exec();
    if (!center || center.blocked) {
      throwError("Center unavailable.", StatusCode.FORBIDDEN);
    }

    const email = `parent.${centerId}.${digits}@parents.attendly.app`;
    let user = await UserModel.findOne({
      role: "parent",
      centerId: new mongoose.Types.ObjectId(centerId),
      phone: digits,
    }).exec();

    const passwordHash = await bcryptjs.hash(crypto.randomBytes(24).toString("hex"), 10);
    const username = `parent_${digits}_${centerId.slice(-5)}`;

    if (!user) {
      user = await UserModel.create({
        username,
        email,
        password: passwordHash,
        role: "parent",
        centerId: new mongoose.Types.ObjectId(centerId),
        phone: digits,
        isVerified: true,
        status: "active",
        name: "Parent",
      });
    }

    const id = user._id.toString();
    const access = generateAccessToken(id, "parent", centerId);
    const refresh = generateRefreshToken(id, "parent", centerId);

    return {
      accessToken: access,
      refreshToken: refresh,
      user: {
        id,
        name: user.name ?? "Parent",
        role: "parent",
        centerId,
        centerName: center.name,
      },
    };
  }
}
