import { inject, injectable } from "tsyringe";
import { SocketService } from "./socket.service";
import { UserModel } from "../models/user.Model";
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
import { logActivity } from "../utils/activityLog.util";
import { NotificationOrchestratorService } from "./notificationOrchestrator.service";

@injectable()
export class AttendanceService implements IAttendanceService {
  constructor(
    @inject(TYPES.IAttendanceRepository)
    private _attendanceRepository: IAttendanceRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository,
    private _notifications: NotificationOrchestratorService
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
    date: string,
    subject?: string
  ): Promise<AttendanceByDateDTO> {
    const normalizedDate = this.normalizeDateOnly(date);
    const records = await this._attendanceRepository.getAttendanceByBatchAndDate(
      centerId,
      batchId,
      normalizedDate,
      subject
    );

    return {
      batchId,
      date: normalizedDate.toISOString().split("T")[0],
      subject,
      records,
    };
  }

  async saveAttendance(centerId: string, markedBy: string, payload: CreateAttendanceDTO): Promise<void> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Attendance marking disabled.");
    const normalizedDate = this.normalizeDateOnly(payload.date);
    const dateStr = typeof payload.date === "string" ? payload.date : payload.date.toISOString().split("T")[0];
    const subject = payload.subject;
    if (payload.records && payload.records.length > 0 && payload.batchId) {
      // 1. Pre-save state check
      const prevRecords = await this._attendanceRepository.getAttendanceByBatchAndDate(
        centerId,
        payload.batchId,
        normalizedDate,
        subject
      );
      const prevStatusMap = new Map<string, string>();
      for (const pr of prevRecords) {
        prevStatusMap.set(pr.studentId, pr.status);
      }

      // 2. Perform upsert
      await this._attendanceRepository.upsertAttendanceByBatchAndDate(
        centerId,
        payload.batchId,
        normalizedDate,
        payload.records,
        markedBy,
        subject
      );

      const owner = await UserModel.findOne({ centerId, role: "center_owner" }).lean().exec();
      if (owner) {
        await SocketService.createAndSendNotification(
          centerId,
          owner._id.toString(),
          "Attendance Marked",
          `Attendance saved for batch on ${dateStr}`,
          "attendance_marked",
          { batchId: payload.batchId, date: dateStr }
        );
      }
      await logActivity({
        centerId,
        actorUserId: markedBy,
        action: "attendance_saved",
        entityType: "attendance",
        entityId: payload.batchId,
        summary: `Attendance saved for batch on ${payload.date}`,
      });

      // 3. Conditional Triggers
      if (process.env.AUTO_NOTIFY_ABSENT === "true") {
        for (const record of payload.records) {
          const prevStatus = prevStatusMap.get(record.studentId);
          const newStatus = record.status;
          
          if ((prevStatus === "absent" || prevStatus === "half_day") && newStatus === "present") {
            this._notifications
              .sendAttendanceCorrectionAlert(centerId, record.studentId, dateStr, markedBy, subject)
              .catch((err) =>
                console.error(`[Attendance] Auto-notify correction student ${record.studentId} failed:`, err)
              );
          } else if ((!prevStatus || prevStatus === "present") && (newStatus === "absent" || newStatus === "half_day")) {
            this._notifications
              .sendAttendanceAlert(centerId, record.studentId, dateStr, newStatus, markedBy, subject)
              .catch((err) =>
                console.error(`[Attendance] Auto-notify absent/half_day student ${record.studentId} failed:`, err)
              );
          }
        }
      }
      return;
    }
    if (payload.studentId && payload.status) {
      // 1. Pre-save state check
      const history = await this._attendanceRepository.getAttendanceHistory(centerId, {
        studentId: payload.studentId,
        batchId: payload.batchId,
        dateFrom: normalizedDate,
        dateTo: normalizedDate,
      });
      // getAttendanceHistory doesn't filter by subject in the repository, so we filter it in-memory
      const relevantHistory = subject ? history.filter(h => h.subject === subject) : history;
      const prevStatus = relevantHistory.length > 0 ? relevantHistory[0].status : null;
      const newStatus = payload.status;

      // 2. Perform upsert
      await this._attendanceRepository.upsertAttendanceRecord(
        centerId,
        payload.studentId,
        normalizedDate,
        payload.status,
        markedBy,
        payload.batchId,
        subject
      );
      const owner = await UserModel.findOne({ centerId, role: "center_owner" }).lean().exec();
      if (owner) {
        await SocketService.createAndSendNotification(
          centerId,
          owner._id.toString(),
          "Attendance Marked",
          `Attendance ${payload.status} for student on ${dateStr}`,
          "attendance_marked",
          { studentId: payload.studentId, status: payload.status, date: dateStr }
        );
      }
      await logActivity({
        centerId,
        actorUserId: markedBy,
        action: "attendance_saved",
        entityType: "attendance",
        entityId: payload.studentId,
        summary: `Attendance ${payload.status} for student on ${payload.date}`,
      });

      // 3. Conditional Triggers
      if (process.env.AUTO_NOTIFY_ABSENT === "true") {
        if ((prevStatus === "absent" || prevStatus === "half_day") && newStatus === "present") {
          this._notifications
            .sendAttendanceCorrectionAlert(centerId, payload.studentId, dateStr, markedBy, subject)
            .catch((err) =>
              console.error(`[Attendance] Auto-notify correction student ${payload.studentId} failed:`, err)
            );
        } else if ((!prevStatus || prevStatus === "present") && (newStatus === "absent" || newStatus === "half_day")) {
          this._notifications
            .sendAttendanceAlert(centerId, payload.studentId, dateStr, newStatus, markedBy, subject)
            .catch((err) =>
              console.error(`[Attendance] Auto-notify absent/half_day student ${payload.studentId} failed:`, err)
            );
        }
      }
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
