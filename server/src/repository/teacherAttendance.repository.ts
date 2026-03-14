import mongoose from "mongoose";
import { BaseRepository } from "./baseRepository";
import { TeacherAttendanceDocument, TeacherAttendanceModel, ITeacherAttendance } from "../models/teacherAttendance.model";
import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
  TeacherAttendanceRecordDTO,
} from "../dtos/teacherAttendance/teacherAttendance.dto";
import { ITeacherAttendanceRepository } from "../core/interfaces/repository/ITeacherAttendanceRepository";
import { MESSAGES } from "../const/messages";

export class TeacherAttendanceRepository
  extends BaseRepository<TeacherAttendanceDocument, ITeacherAttendance>
  implements ITeacherAttendanceRepository
{
  constructor() {
    super(TeacherAttendanceModel);
  }

  private mapRecord(record: any): TeacherAttendanceRecordDTO {
    const teacherObjectId = record.teacherId?._id ?? record.teacherId;
    const teacherId = teacherObjectId?.toString?.() ?? (teacherObjectId ? String(teacherObjectId) : "");
    return {
      id: record._id.toString(),
      teacherId,
      centerId: record.centerId?.toString(),
      date: record.date,
      status: record.status,
      shift: record.shift,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
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

  async upsertAttendance(centerId: string, payload: CreateTeacherAttendanceDTO): Promise<TeacherAttendanceRecordDTO> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const teacherObjectId = new mongoose.Types.ObjectId(payload.teacherId);

      await this.model.updateOne(
        { centerId: centerObjectId, teacherId: teacherObjectId, date: payload.date },
        {
          $set: {
            status: payload.status,
            shift: payload.shift,
            checkInTime: payload.checkInTime,
            checkOutTime: payload.checkOutTime,
          },
          $setOnInsert: {
            centerId: centerObjectId,
            teacherId: teacherObjectId,
            date: payload.date,
          },
        },
        { upsert: true }
      );

      const record = await this.model
        .findOne({ centerId: centerObjectId, teacherId: teacherObjectId, date: payload.date })
        .populate({ path: "teacherId", select: "name username phone" })
        .lean()
        .exec();

      return this.mapRecord(record);
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ERROR);
    }
  }

  async getAttendance(
    centerId: string,
    filters: TeacherAttendanceFiltersDTO
  ): Promise<TeacherAttendanceRecordDTO[]> {
    try {
      const centerObjectId = new mongoose.Types.ObjectId(centerId);
      const match: Record<string, unknown> = { centerId: centerObjectId };
      if (filters.teacherId) {
        match.teacherId = new mongoose.Types.ObjectId(filters.teacherId);
      }
      if (filters.date) {
        match.date = filters.date;
      } else if (filters.dateFrom || filters.dateTo) {
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
        .sort({ date: -1, updatedAt: -1 })
        .populate({ path: "teacherId", select: "name username phone" })
        .lean()
        .exec();

      return records.map((record) => this.mapRecord(record));
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
