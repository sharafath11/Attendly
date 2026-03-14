import { inject, injectable } from "tsyringe";
import { IAttendanceService } from "../core/interfaces/services/IAttendanceService";
import { IAttendanceRepository } from "../core/interfaces/repository/IAttendanceRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
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
    private _attendanceRepository: IAttendanceRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
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

  private async ensureActiveSubscription(centerId: string, message: string): Promise<void> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    if (center.blocked) {
      throwError("Your center account has been blocked.", StatusCode.FORBIDDEN);
    }
    if (center.subscriptionStatus !== "active") {
      throwError(message, StatusCode.FORBIDDEN);
    }
  }

  async getStudentAttendanceSummary(
    centerId: string,
    studentId: string
  ): Promise<StudentAttendanceSummaryDTO> {
    return this._attendanceRepository.getStudentAttendanceSummary(centerId, studentId);
  }

  async getBatchAttendanceSummary(centerId: string, batchId: string): Promise<BatchAttendanceSummaryDTO> {
    const dateFrom = this.getLast30DaysStart();
    return this._attendanceRepository.getBatchAttendanceSummary(centerId, batchId, dateFrom);
  }

  async getLowAttendanceStudents(centerId: string, batchId: string): Promise<LowAttendanceStudentDTO[]> {
    const dateFrom = this.getLast30DaysStart();
    return this._attendanceRepository.getLowAttendanceStudents(centerId, batchId, dateFrom, 75);
  }

  async getAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: string
  ): Promise<AttendanceByDateDTO> {
    const normalizedDate = this.normalizeDateOnly(date);
    const records = await this._attendanceRepository.getAttendanceByBatchAndDate(
      centerId,
      batchId,
      normalizedDate
    );

    return {
      batchId,
      date: normalizedDate.toISOString().split("T")[0],
      records,
    };
  }

  async saveAttendance(centerId: string, markedBy: string, payload: CreateAttendanceDTO): Promise<void> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Attendance marking disabled.");
    const normalizedDate = this.normalizeDateOnly(payload.date);
    if (payload.records && payload.records.length > 0 && payload.batchId) {
      await this._attendanceRepository.upsertAttendanceByBatchAndDate(
        centerId,
        payload.batchId,
        normalizedDate,
        payload.records,
        markedBy
      );
      return;
    }
    if (payload.studentId && payload.status) {
      await this._attendanceRepository.upsertAttendanceRecord(
        centerId,
        payload.studentId,
        normalizedDate,
        payload.status,
        markedBy,
        payload.batchId
      );
    }
  }

  async getAttendanceHistory(
    centerId: string,
    filters: {
      studentId?: string;
      batchId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) {
    const dateFrom = filters.dateFrom ? this.normalizeDateOnly(filters.dateFrom) : undefined;
    const dateTo = filters.dateTo ? this.normalizeDateOnly(filters.dateTo) : undefined;
    return this._attendanceRepository.getAttendanceHistory(centerId, {
      studentId: filters.studentId,
      batchId: filters.batchId,
      dateFrom,
      dateTo,
    });
  }
}
