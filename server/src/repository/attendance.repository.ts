import mongoose from "mongoose";
import {
  AttendanceRecordDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../dtos/attendance/attendance.dto";
import { IAttendanceRepository } from "../core/interfaces/repository/IAttendanceRepository";
import { AttendanceDocument, AttendanceModel, IAttendance } from "../models/attendance.model";
import { BaseRepository } from "./baseRepository";
import { MESSAGES } from "../const/messages";

export class AttendanceRepository
  extends BaseRepository<AttendanceDocument, IAttendance>
  implements IAttendanceRepository
{
  constructor() {
    super(AttendanceModel);
  }

  async getStudentAttendanceSummary(centerId: string, studentId: string): Promise<StudentAttendanceSummaryDTO> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const [summary] = await this.model.aggregate([
        {
          $match: {
            centerId: centerObjectId,
            studentId: new mongoose.Types.ObjectId(studentId),
          },
        },
        {
          $group: {
            _id: "$studentId",
            totalClasses: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            totalClasses: 1,
            present: 1,
            absent: { $subtract: ["$totalClasses", "$present"] },
            attendancePercentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                {
                  $round: [
                    {
                      $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
      ]);

      if (!summary) {
        return {
          studentId,
          totalClasses: 0,
          present: 0,
          absent: 0,
          attendancePercentage: 0,
        };
      }

      return {
        studentId,
        totalClasses: summary.totalClasses ?? 0,
        present: summary.present ?? 0,
        absent: summary.absent ?? 0,
        attendancePercentage: summary.attendancePercentage ?? 0,
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ONE_ERROR);
    }
  }

  async getBatchAttendanceSummary(
    centerId: string,
    batchId: string,
    dateFrom: Date
  ): Promise<BatchAttendanceSummaryDTO> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);

      const baseMatch = {
        centerId: centerObjectId,
        batchId: batchObjectId,
        date: { $gte: dateFrom },
      };

      const [summary] = await this.model.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$studentId",
            totalClasses: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            totalClasses: 1,
            present: 1,
            attendancePercentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                { $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100] },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            averageAttendance: { $avg: "$attendancePercentage" },
            totalClasses: { $sum: "$totalClasses" },
            totalPresent: { $sum: "$present" },
          },
        },
        {
          $project: {
            totalStudents: 1,
            averageAttendance: { $round: ["$averageAttendance", 0] },
            totalPresent: 1,
            totalAbsent: { $subtract: ["$totalClasses", "$totalPresent"] },
          },
        },
      ]);

      const dailyTrend = await this.model.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalClasses: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            label: "$_id",
            present: 1,
            absent: { $subtract: ["$totalClasses", "$present"] },
            attendancePercentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                {
                  $round: [
                    {
                      $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { label: 1 } },
      ]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      const monthlyTrend = await this.model.aggregate([
        {
          $match: {
            centerId: centerObjectId,
            batchId: batchObjectId,
            date: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
            totalClasses: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            label: "$_id",
            present: 1,
            absent: { $subtract: ["$totalClasses", "$present"] },
            attendancePercentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                {
                  $round: [
                    {
                      $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $sort: { label: 1 } },
      ]);

      return {
        batchId,
        totalStudents: summary?.totalStudents ?? 0,
        averageAttendance: summary?.averageAttendance ?? 0,
        totalPresent: summary?.totalPresent ?? 0,
        totalAbsent: summary?.totalAbsent ?? 0,
        dateRange: "last30days",
        dailyTrend,
        monthlyTrend,
      };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ONE_ERROR);
    }
  }

  async getLowAttendanceStudents(
    centerId: string,
    batchId: string,
    dateFrom: Date,
    threshold: number
  ): Promise<LowAttendanceStudentDTO[]> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);

      const results = await this.model.aggregate([
        {
          $match: {
            $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
            batchId: batchObjectId,
            date: { $gte: dateFrom },
          },
        },
        {
          $group: {
            _id: "$studentId",
            totalClasses: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            attendancePercentage: {
              $cond: [
                { $gt: ["$totalClasses", 0] },
                {
                  $multiply: [{ $divide: ["$present", "$totalClasses"] }, 100],
                },
                0,
              ],
            },
          },
        },
        { $match: { attendancePercentage: { $lt: threshold } } },
        {
          $lookup: {
            from: "students",
            let: { studentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$studentId"] },
                      { $or: [{ $eq: ["$centerId", centerObjectId] }, { $eq: ["$userId", centerObjectId] }] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
              { $project: { name: 1 } },
            ],
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $project: {
            studentId: "$_id",
            studentName: "$student.name",
            attendancePercentage: { $round: ["$attendancePercentage", 0] },
          },
        },
        { $sort: { attendancePercentage: 1 } },
      ]);

      return results as LowAttendanceStudentDTO[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async getAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: Date
  ): Promise<AttendanceRecordDTO[]> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const records = await this.model
        .find({
          $or: [{ centerId: centerObjectId }, { userId: centerObjectId }],
          batchId: new mongoose.Types.ObjectId(batchId),
          date,
        })
        .select({ studentId: 1, status: 1 })
        .lean()
        .exec();

      return records.map((record) => ({
        studentId: record.studentId.toString(),
        status: record.status as "present" | "absent" | "leave",
      }));
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async upsertAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: Date,
    records: AttendanceRecordDTO[],
    markedBy: string
  ): Promise<void> {
    try {
      const now = new Date();
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);
      const markedByObjectId = new mongoose.Types.ObjectId(markedBy);

      const operations = records.map((record) => ({
        updateOne: {
          filter: {
            centerId: centerObjectId,
            batchId: batchObjectId,
            studentId: new mongoose.Types.ObjectId(record.studentId),
            date,
          },
          update: {
            $set: {
              status: record.status,
              markedBy: markedByObjectId,
            },
            $setOnInsert: {
              centerId: centerObjectId,
              batchId: batchObjectId,
              studentId: new mongoose.Types.ObjectId(record.studentId),
              date,
              createdAt: now,
            },
          },
          upsert: true,
        },
      }));

      if (operations.length === 0) return;

      await this.model.bulkWrite(operations);
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_MANY_ERROR);
    }
  }

  async upsertAttendanceRecord(
    centerId: string,
    studentId: string,
    date: Date,
    status: AttendanceRecordDTO["status"],
    markedBy: string,
    batchId?: string
  ): Promise<void> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const studentObjectId = new mongoose.Types.ObjectId(studentId);
      const markedByObjectId = new mongoose.Types.ObjectId(markedBy);
      const update: Record<string, unknown> = {
        status,
        markedBy: markedByObjectId,
        centerId: centerObjectId,
        studentId: studentObjectId,
        date,
      };
      if (batchId) {
        update.batchId = new mongoose.Types.ObjectId(batchId);
      }

      await this.model.updateOne(
        { studentId: studentObjectId, date },
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ERROR);
    }
  }

  async getAttendanceHistory(
    centerId: string,
    filters: {
      studentId?: string;
      batchId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<
    {
      id: string;
      studentId: string;
      batchId: string;
      date: string;
      status: "present" | "absent" | "leave";
      markedBy?: string;
      createdAt?: Date;
      updatedAt?: Date;
      student?: { id: string; name: string };
      batch?: { id: string; batchName: string };
      marker?: { id: string; name: string; role?: string };
    }[]
  > {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const match: Record<string, unknown> = { centerId: centerObjectId };
      if (filters.studentId) {
        match.studentId = new mongoose.Types.ObjectId(filters.studentId);
      }
      if (filters.batchId) {
        match.batchId = new mongoose.Types.ObjectId(filters.batchId);
      }
      if (filters.dateFrom || filters.dateTo) {
        match.date = {};
        if (filters.dateFrom) {
          (match.date as Record<string, unknown>).$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          (match.date as Record<string, unknown>).$lte = filters.dateTo;
        }
      }

      const records = await this.model
        .find(match)
        .sort({ date: -1 })
        .populate({ path: "studentId", select: "name" })
        .populate({ path: "batchId", select: "batchName" })
        .populate({ path: "markedBy", select: "name role" })
        .lean()
        .exec();

      return records.map((record) => {
        const student = record.studentId as any;
        const batch = record.batchId as any;
        const marker = record.markedBy as any;
        return {
          id: record._id.toString(),
          studentId: student?._id?.toString?.() ?? record.studentId.toString(),
          batchId: batch?._id?.toString?.() ?? record.batchId.toString(),
          date: record.date.toISOString().split("T")[0],
          status: record.status as "present" | "absent" | "leave",
          markedBy: marker?._id?.toString?.() ?? record.markedBy?.toString(),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          student: student
            ? { id: student._id?.toString?.() ?? record.studentId.toString(), name: student.name }
            : undefined,
          batch: batch
            ? { id: batch._id?.toString?.() ?? record.batchId.toString(), batchName: batch.batchName }
            : undefined,
          marker: marker
            ? {
                id: marker._id?.toString?.() ?? record.markedBy.toString(),
                name: marker.name ?? "User",
                role: marker.role,
              }
            : undefined,
        };
      });
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
