import mongoose from "mongoose";
import { injectable } from "tsyringe";
import { normalizePhoneDigits } from "../utils/phone.util";
import { StudentModel } from "../models/students.model";
import { FeeModel } from "../models/fees.model";
import { AttendanceModel } from "../models/attendance.model";
import { CenterModel } from "../models/center.model";
import { BatchModel } from "../models/batches.model";
import { NotificationModel } from "../models/notification.model";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

@injectable()
export class ParentPortalService {
  private async getLinkedStudents(centerId: string, parentPhoneDigits: string) {
    const students = await StudentModel.find({
      isDeleted: false,
      centerId: new mongoose.Types.ObjectId(centerId),
    })
      .lean()
      .exec();
    return students.filter((s) => normalizePhoneDigits(s.parentPhone ?? "") === parentPhoneDigits);
  }

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
