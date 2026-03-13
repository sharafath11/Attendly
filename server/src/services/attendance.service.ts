import { inject, injectable } from "tsyringe";
import { IAttendanceService } from "../core/interfaces/services/IAttendanceService";
import { IAttendanceRepository } from "../core/interfaces/repository/IAttendanceRepository";
import { TYPES } from "../core/types";
import {
  AttendanceByDateDTO,
  CreateAttendanceDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../dtos/attendance/attendance.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

@injectable()
export class AttendanceService implements IAttendanceService {
  constructor(
    @inject(TYPES.IAttendanceRepository)
    private _attendanceRepository: IAttendanceRepository
  ) {}

  private getLast30DaysStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeDateOnly(value: string | Date): Date {
    if (typeof value === "string") {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        throwError("Invalid date", StatusCode.BAD_REQUEST);
      }
      return parsed;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throwError("Invalid date", StatusCode.BAD_REQUEST);
    }
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  async getStudentAttendanceSummary(
    userId: string,
    studentId: string
  ): Promise<StudentAttendanceSummaryDTO> {
    return this._attendanceRepository.getStudentAttendanceSummary(userId, studentId);
  }

  async getBatchAttendanceSummary(userId: string, batchId: string): Promise<BatchAttendanceSummaryDTO> {
    const dateFrom = this.getLast30DaysStart();
    return this._attendanceRepository.getBatchAttendanceSummary(userId, batchId, dateFrom);
  }

  async getLowAttendanceStudents(userId: string, batchId: string): Promise<LowAttendanceStudentDTO[]> {
    const dateFrom = this.getLast30DaysStart();
    return this._attendanceRepository.getLowAttendanceStudents(userId, batchId, dateFrom, 75);
  }

  async getAttendanceByBatchAndDate(
    userId: string,
    batchId: string,
    date: string
  ): Promise<AttendanceByDateDTO> {
    const normalizedDate = this.normalizeDateOnly(date);
    const records = await this._attendanceRepository.getAttendanceByBatchAndDate(
      userId,
      batchId,
      normalizedDate
    );

    return {
      batchId,
      date: normalizedDate.toISOString().split("T")[0],
      records,
    };
  }

  async saveAttendance(userId: string, payload: CreateAttendanceDTO): Promise<void> {
    const normalizedDate = this.normalizeDateOnly(payload.date);
    await this._attendanceRepository.upsertAttendanceByBatchAndDate(
      userId,
      payload.batchId,
      normalizedDate,
      payload.records
    );
  }
}
