import mongoose from "mongoose";
import { BaseRepository } from "./baseRepository";
import { TeacherPaymentDocument, TeacherPaymentModel, ITeacherPayment } from "../models/teacherPayments.model";
import {
  CreateTeacherPaymentDTO,
  TeacherPaymentFiltersDTO,
  TeacherPaymentRecordDTO,
} from "../dtos/teacherPayments/teacherPayments.dto";
import { ITeacherPaymentsRepository } from "../core/interfaces/repository/ITeacherPaymentsRepository";
import { MESSAGES } from "../const/messages";

export class TeacherPaymentsRepository
  extends BaseRepository<TeacherPaymentDocument, ITeacherPayment>
  implements ITeacherPaymentsRepository
{
  constructor() {
    super(TeacherPaymentModel);
  }

  private mapRecord(record: any): TeacherPaymentRecordDTO {
    const teacherObjectId = record.teacherId?._id ?? record.teacherId;
    const teacherId = teacherObjectId?.toString?.() ?? (teacherObjectId ? String(teacherObjectId) : "");
    return {
      id: record._id.toString(),
      teacherId,
      centerId: record.centerId?.toString(),
      amount: record.amount,
      month: record.month,
      year: record.year,
      notes: record.notes,
      paidDate: record.paidDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      teacher: record.teacherId
        ? {
            id: teacherId,
            name: record.teacherId.name ?? record.teacherId.username ?? "Teacher",
            username: record.teacherId.username,
            phone: record.teacherId.phone,
          }
        : undefined,
    };
  }

  async createPayment(centerId: string, payload: CreateTeacherPaymentDTO): Promise<TeacherPaymentRecordDTO> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const now = new Date();
      const created = await this.model.create({
        teacherId: new mongoose.Types.ObjectId(payload.teacherId),
        centerId: centerObjectId,
        amount: payload.amount,
        month: payload.month,
        year: payload.year,
        notes: payload.notes,
        paidDate: now,
      });
      const populated = await this.model
        .findById(created._id)
        .populate({ path: "teacherId", select: "name username phone" })
        .lean()
        .exec();

      return this.mapRecord(populated ?? created.toObject());
    } catch (error) {
      if (error instanceof Error && (error as any).code === 11000) {
        throw this.handleError(error, "Payment already recorded for this teacher and month");
      }
      throw this.handleError(error, MESSAGES.REPOSITORY.CREATE_ERROR);
    }
  }

  async getPayments(centerId: string, filters: TeacherPaymentFiltersDTO): Promise<TeacherPaymentRecordDTO[]> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const match: Record<string, unknown> = { centerId: centerObjectId };
      if (filters.teacherId) {
        match.teacherId = new mongoose.Types.ObjectId(filters.teacherId);
      }
      if (filters.month) {
        match.month = filters.month;
      }
      if (filters.year) {
        match.year = filters.year;
      }

      const results = await this.model
        .find(match)
        .sort({ paidDate: -1, createdAt: -1 })
        .populate({ path: "teacherId", select: "name username phone" })
        .lean()
        .exec();

      return results.map((record) => this.mapRecord(record));
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
