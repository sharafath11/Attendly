import mongoose from "mongoose";
import { BaseRepository } from "./baseRepository";
import { FeeDocument, FeeModel, IFee } from "../models/fees.model";
import { StudentModel } from "../models/students.model";
import { IFeesRepository } from "../core/interfaces/repository/IFeesRepository";
import { FeeFiltersDTO, FeeRecordDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../dtos/fees/fees.dto";
import { MESSAGES } from "../const/messages";

export class FeesRepository extends BaseRepository<FeeDocument, IFee> implements IFeesRepository {
  constructor() {
    super(FeeModel);
  }

  async ensureFeesForMonth(centerId: string, filters: FeeFiltersDTO): Promise<void> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const studentFilter: Record<string, unknown> = {
        $or: [{ centerId: centerObjectId }, { userId: centerId }],
        isDeleted: false,
      };
      if (filters.batchId) {
        studentFilter.batchId = new mongoose.Types.ObjectId(filters.batchId);
      }

      const students = await StudentModel.find(studentFilter)
        .select({ _id: 1, batchId: 1, monthlyFee: 1 })
        .lean()
        .exec();

      if (students.length === 0) return;

      const studentIds = students.map((student) => student._id);

      const existingFees = await this.model
        .find({
          $or: [{ centerId: centerObjectId }, { userId: centerId }],
          studentId: { $in: studentIds },
          month: filters.month,
          year: filters.year,
        })
        .select({ studentId: 1 })
        .lean()
        .exec();

      const existingSet = new Set(existingFees.map((fee) => fee.studentId.toString()));
      const now = new Date();

      const operations = students
        .filter((student) => !existingSet.has(student._id.toString()))
        .map((student) => ({
          updateOne: {
            filter: {
              $or: [{ centerId: centerObjectId }, { userId: centerId }],
              studentId: student._id,
              month: filters.month,
              year: filters.year,
            },
            update: {
              $setOnInsert: {
                centerId: centerObjectId,
                userId: centerObjectId,
                studentId: student._id,
                batchId: student.batchId,
                month: filters.month,
                year: filters.year,
                amount: student.monthlyFee,
                status: "Pending",
                createdAt: now,
              },
            },
            upsert: true,
          },
        }));

      if (operations.length === 0) return;

      await this.model.bulkWrite(operations);
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.CREATE_ERROR);
    }
  }

  async getFees(centerId: string, filters: FeeFiltersDTO): Promise<FeeRecordDTO[]> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const match: Record<string, unknown> = {
        $or: [{ centerId: centerObjectId }, { userId: centerId }],
        month: filters.month,
        year: filters.year,
      };
      if (filters.batchId) {
        match.batchId = new mongoose.Types.ObjectId(filters.batchId);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const statusMatch =
        filters.status && filters.status !== "All"
          ? { effectiveStatus: filters.status }
          : null;

      const pipeline: any[] = [
        { $match: match },
        {
          $addFields: {
            effectiveStatus: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Pending"] },
                    {
                      $or: [
                        { $lt: ["$year", currentYear] },
                        {
                          $and: [
                            { $eq: ["$year", currentYear] },
                            { $lt: ["$month", currentMonth] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                "Overdue",
                "$status",
              ],
            },
          },
        },
        ...(statusMatch ? [{ $match: statusMatch }] : []),
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $lookup: {
            from: "batches",
            localField: "batchId",
            foreignField: "_id",
            as: "batch",
          },
        },
        { $unwind: "$batch" },
        {
          $project: {
            id: "$_id",
            studentId: { $toString: "$studentId" },
            batchId: { $toString: "$batchId" },
            month: 1,
            year: 1,
            amount: 1,
            status: "$effectiveStatus",
            paymentMethod: 1,
            paidDate: 1,
            markedBy: { $toString: "$markedBy" },
            editedBy: { $toString: "$editedBy" },
            changeNote: 1,
            editHistory: {
              $map: {
                input: "$editHistory",
                as: "entry",
                in: {
                  editedBy: { $toString: "$$entry.editedBy" },
                  previousStatus: "$$entry.previousStatus",
                  newStatus: "$$entry.newStatus",
                  note: "$$entry.note",
                  editedAt: "$$entry.editedAt",
                },
              },
            },
            createdAt: 1,
            updatedAt: 1,
            student: {
              id: { $toString: "$student._id" },
              name: "$student.name",
              phone: "$student.phone",
              parentPhone: "$student.parentPhone",
              monthlyFee: "$student.monthlyFee",
            },
            batch: {
              id: { $toString: "$batch._id" },
              batchName: "$batch.batchName",
              classLevel: "$batch.classLevel",
              session: "$batch.session",
              medium: "$batch.medium",
            },
          },
        },
        { $sort: { "student.name": 1 } },
      ];

      return (await this.model.aggregate(pipeline)) as FeeRecordDTO[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async markFeePaid(centerId: string, payload: MarkFeePaidDTO): Promise<void> {
    try {
      const now = new Date();
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const existing = await this.model.findOne({
        $or: [{ centerId: centerObjectId }, { userId: centerId }],
        studentId: new mongoose.Types.ObjectId(payload.studentId),
        batchId: new mongoose.Types.ObjectId(payload.batchId),
        month: payload.month,
        year: payload.year,
      });

      const previousStatus = existing?.status ?? "Pending";

      await this.model.updateOne(
        {
          $or: [{ centerId: centerObjectId }, { userId: centerId }],
          studentId: new mongoose.Types.ObjectId(payload.studentId),
          batchId: new mongoose.Types.ObjectId(payload.batchId),
          month: payload.month,
          year: payload.year,
        },
        {
          $set: {
            status: "Paid",
            paymentMethod: payload.paymentMethod,
            paidDate: now,
            markedBy: existing?.markedBy ?? centerObjectId,
            editedBy: centerObjectId,
          },
          $push: {
            editHistory: {
              editedBy: centerObjectId,
              previousStatus,
              newStatus: "Paid",
              note: "Marked as paid",
              editedAt: now,
            },
          },
        }
      );
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ONE_ERROR);
    }
  }

  async updateFeeStatus(centerId: string, payload: UpdateFeeStatusDTO): Promise<void> {
    try {
      const now = new Date();
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const existing = await this.model.findOne({
        $or: [{ centerId: centerObjectId }, { userId: centerId }],
        studentId: new mongoose.Types.ObjectId(payload.studentId),
        batchId: new mongoose.Types.ObjectId(payload.batchId),
        month: payload.month,
        year: payload.year,
      });

      const previousStatus = existing?.status ?? "Pending";

      await this.model.updateOne(
        {
          $or: [{ centerId: centerObjectId }, { userId: centerId }],
          studentId: new mongoose.Types.ObjectId(payload.studentId),
          batchId: new mongoose.Types.ObjectId(payload.batchId),
          month: payload.month,
          year: payload.year,
        },
        {
          $set: {
            status: payload.status,
            editedBy: centerObjectId,
            changeNote: payload.changeNote,
            ...(payload.status === "Paid" ? { paidDate: now } : { paidDate: null }),
          },
          $push: {
            editHistory: {
              editedBy: centerObjectId,
              previousStatus,
              newStatus: payload.status,
              note: payload.changeNote,
              editedAt: now,
            },
          },
        }
      );
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ONE_ERROR);
    }
  }

  async getPendingFees(centerId: string, month?: number, year?: number): Promise<FeeRecordDTO[]> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const match: Record<string, unknown> = {
        $or: [{ centerId: new mongoose.Types.ObjectId(centerId) }, { userId: centerId }],
      };
      if (month && year) {
        match.month = month;
        match.year = year;
      }

      const pipeline: any[] = [
        { $match: match },
        {
          $addFields: {
            effectiveStatus: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Pending"] },
                    {
                      $or: [
                        { $lt: ["$year", currentYear] },
                        {
                          $and: [
                            { $eq: ["$year", currentYear] },
                            { $lt: ["$month", currentMonth] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                "Overdue",
                "$status",
              ],
            },
          },
        },
        { $match: { effectiveStatus: { $in: ["Pending", "Overdue"] } } },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $lookup: {
            from: "batches",
            localField: "batchId",
            foreignField: "_id",
            as: "batch",
          },
        },
        { $unwind: "$batch" },
        {
          $project: {
            id: "$_id",
            studentId: { $toString: "$studentId" },
            batchId: { $toString: "$batchId" },
            month: 1,
            year: 1,
            amount: 1,
            status: "$effectiveStatus",
            paymentMethod: 1,
            paidDate: 1,
            markedBy: { $toString: "$markedBy" },
            editedBy: { $toString: "$editedBy" },
            changeNote: 1,
            editHistory: {
              $map: {
                input: "$editHistory",
                as: "entry",
                in: {
                  editedBy: { $toString: "$$entry.editedBy" },
                  previousStatus: "$$entry.previousStatus",
                  newStatus: "$$entry.newStatus",
                  note: "$$entry.note",
                  editedAt: "$$entry.editedAt",
                },
              },
            },
            createdAt: 1,
            updatedAt: 1,
            student: {
              id: { $toString: "$student._id" },
              name: "$student.name",
              phone: "$student.phone",
              parentPhone: "$student.parentPhone",
              monthlyFee: "$student.monthlyFee",
            },
            batch: {
              id: { $toString: "$batch._id" },
              batchName: "$batch.batchName",
              classLevel: "$batch.classLevel",
              session: "$batch.session",
              medium: "$batch.medium",
            },
          },
        },
        { $sort: { "student.name": 1 } },
      ];

      return (await this.model.aggregate(pipeline)) as FeeRecordDTO[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
