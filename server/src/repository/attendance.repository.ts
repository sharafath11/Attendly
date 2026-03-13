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

  async getStudentAttendanceSummary(userId: string, studentId: string): Promise<StudentAttendanceSummaryDTO> {
    try {
      const [summary] = await this.model.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            studentId: new mongoose.Types.ObjectId(studentId),
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
    userId: string,
    batchId: string,
    dateFrom: Date
  ): Promise<BatchAttendanceSummaryDTO> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);

      const baseMatch = {
        userId: userObjectId,
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
                $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
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
            userId: userObjectId,
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
    userId: string,
    batchId: string,
    dateFrom: Date,
    threshold: number
  ): Promise<LowAttendanceStudentDTO[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);

      const results = await this.model.aggregate([
        {
          $match: {
            userId: userObjectId,
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
                      { $eq: ["$userId", userObjectId] },
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
    userId: string,
    batchId: string,
    date: Date
  ): Promise<AttendanceRecordDTO[]> {
    try {
      const records = await this.model
        .find({
          userId: new mongoose.Types.ObjectId(userId),
          batchId: new mongoose.Types.ObjectId(batchId),
          date,
        })
        .select({ studentId: 1, status: 1 })
        .lean()
        .exec();

      return records.map((record) => ({
        studentId: record.studentId.toString(),
        status: record.status as "Present" | "Absent",
      }));
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async upsertAttendanceByBatchAndDate(
    userId: string,
    batchId: string,
    date: Date,
    records: AttendanceRecordDTO[]
  ): Promise<void> {
    try {
      const now = new Date();
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const batchObjectId = new mongoose.Types.ObjectId(batchId);

      const operations = records.map((record) => ({
        updateOne: {
          filter: {
            userId: userObjectId,
            batchId: batchObjectId,
            studentId: new mongoose.Types.ObjectId(record.studentId),
            date,
          },
          update: {
            $set: {
              status: record.status,
            },
            $setOnInsert: {
              userId: userObjectId,
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
}
