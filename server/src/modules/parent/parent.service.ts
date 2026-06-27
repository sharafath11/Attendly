import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { injectable } from "tsyringe";
import mongoose from "mongoose";
import { redis } from "../../utils/redis";
import { generateOtp, OTP_TTL_SECONDS } from "../../utils/otp.util";
import { normalizePhoneDigits } from "../../utils/phone.util";
import { throwError } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { UserModel } from "../../models/user.Model";
import { StudentModel } from "../../models/students.model";
import { CenterModel } from "../../models/center.model";
import { FeeModel } from "../../models/fees.model";
import { AttendanceModel } from "../../models/attendance.model";
import { BatchModel } from "../../models/batches.model";
import { NotificationModel } from "../../models/notification.model";
import { enqueueWhatsAppMessage } from "../../services/whatsappQueue.service";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwtToken";
import { OtpSessionModel } from "../../models/otpSession.model";

const OTP_PREFIX = "otp:parent:";

function matchesParentPhone(stored: string | undefined, digits: string): boolean {
  if (!stored) return false;
  return normalizePhoneDigits(stored) === digits;
}

@injectable()
export class ParentService {
  // === Helpers ===

  private async getLinkedStudents(centerId: string, parentPhoneDigits: string) {
    return StudentModel.find({
      isDeleted: false,
      centerId: new mongoose.Types.ObjectId(centerId),
      parentPhone: { $regex: `${parentPhoneDigits}$` },
    })
      .lean()
      .exec();
  }

  // === Authentication ===

  async requestOtp(phoneRaw: string, centerIdHint?: string) {
    const digits = normalizePhoneDigits(phoneRaw);
    if (digits.length < 10) {
      throwError("Enter a valid 10-digit mobile number.", StatusCode.BAD_REQUEST);
    }

    const linked = await StudentModel.find({
      isDeleted: false,
      parentPhone: { $regex: `${digits}$` },
    })
      .select("parentPhone centerId name")
      .lean()
      .exec();
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
    
    // Save to OtpSession with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OtpSessionModel.create({
      phone: digits,
      otp,
      centerId: new mongoose.Types.ObjectId(centerId),
      expiresAt
    });

    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    const centerObj = await CenterModel.findById(centerId).select("name").lean();
    const centerName = centerObj?.name || "our";
    const msg = `Dear Parent, your login verification OTP for ${centerName} portal is: ${otp}. It is valid for 5 minutes. (Ref: ${timestamp})`;
    
    await enqueueWhatsAppMessage({
      phone: digits,
      message: msg,
      centerId
    }).catch(err => console.error("[Parent OTP] Failed to enqueue WhatsApp message", err));

    return {
      needsCenterPick: false as const,
      centerId,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  }

  async verifyOtp(phoneRaw: string, otp: string, centerIdHint?: string) {
    const digits = normalizePhoneDigits(phoneRaw);
    
    const session = await OtpSessionModel.findOne({
      phone: digits,
      otp,
      ...(centerIdHint ? { centerId: new mongoose.Types.ObjectId(centerIdHint) } : {})
    }).sort({ createdAt: -1 }).exec();

    if (!session || session.expiresAt < new Date()) {
      throwError("Invalid or expired code.", StatusCode.BAD_REQUEST);
    }

    const linked = await StudentModel.find({
      isDeleted: false,
      parentPhone: { $regex: `${digits}$` },
    })
      .lean()
      .exec();
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

    await OtpSessionModel.deleteOne({ _id: session._id });

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

  // === Portal Features ===

  async getDashboard(centerId: string, parentPhoneDigits: string) {
    const center = await CenterModel.findById(centerId).select("name").lean().exec();
    const students = await this.getLinkedStudents(centerId, parentPhoneDigits);
    if (!students.length) {
      throwError("No linked students.", StatusCode.FORBIDDEN);
    }

    const studentIds = students.map((s) => s._id);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const fees = await FeeModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: { $in: studentIds },
      month,
      year,
    })
      .lean()
      .exec();

    const pendingAmount = fees.filter((f) => f.status !== "Paid").reduce((a, f) => a + f.amount, 0);
    const pendingCount = fees.filter((f) => f.status !== "Paid").length;

    const from = new Date();
    from.setDate(from.getDate() - 30);

    const attendanceDocs = await AttendanceModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: { $in: studentIds },
      date: { $gte: from },
    })
      .lean()
      .exec();

    const presentCount = attendanceDocs.filter((a) => a.status === "present").length;
    const totalMarked = attendanceDocs.length;
    const attendanceRate = totalMarked ? Math.round((presentCount / totalMarked) * 100) : 0;

    return {
      centerName: center?.name ?? "Center",
      children: students.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        monthlyFee: s.monthlyFee,
      })),
      month: { month, year },
      pendingFees: { count: pendingCount, amount: pendingAmount },
      attendanceRateLast30d: attendanceRate,
    };
  }

  async getAttendance(centerId: string, parentPhoneDigits: string, limit = 30) {
    const students = await this.getLinkedStudents(centerId, parentPhoneDigits);
    if (!students.length) throwError("No linked students.", StatusCode.FORBIDDEN);
    const studentIds = students.map((s) => s._id);
    const nameById = new Map(students.map((s) => [s._id.toString(), s.name]));

    const rows = await AttendanceModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: { $in: studentIds },
    })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
      .exec();

    return rows.map((r) => ({
      id: r._id.toString(),
      studentId: r.studentId.toString(),
      studentName: nameById.get(r.studentId.toString()) ?? "",
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    }));
  }

  async getFees(centerId: string, parentPhoneDigits: string) {
    const students = await this.getLinkedStudents(centerId, parentPhoneDigits);
    if (!students.length) throwError("No linked students.", StatusCode.FORBIDDEN);
    const studentIds = students.map((s) => s._id);

    const fees = await FeeModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: { $in: studentIds },
    })
      .sort({ year: -1, month: -1 })
      .limit(24)
      .lean()
      .exec();

    const batchIds = [...new Set(fees.map((f) => f.batchId.toString()))];
    const batches = await BatchModel.find({ _id: { $in: batchIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select("batchName")
      .lean()
      .exec();
    const batchName = (id: string) => batches.find((b) => b._id.toString() === id)?.batchName ?? "";

    const nameById = new Map(students.map((s) => [s._id.toString(), s.name]));

    return fees.map((f) => ({
      id: f._id.toString(),
      studentName: nameById.get(f.studentId.toString()) ?? "",
      batchName: batchName(f.batchId.toString()),
      month: f.month,
      year: f.year,
      amount: f.amount,
      status: f.status,
      paidDate: f.paidDate ? f.paidDate.toISOString() : null,
    }));
  }

  async getNotifications(centerId: string, parentUserId: string, limit = 50) {
    return NotificationModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
      parentUserId: new mongoose.Types.ObjectId(parentUserId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec()
      .then((rows) =>
        rows.map((n) => ({
          id: n._id.toString(),
          type: n.type,
          channel: n.channel,
          status: n.status,
          message: n.message,
          createdAt: n.createdAt.toISOString(),
        }))
      );
  }
}
