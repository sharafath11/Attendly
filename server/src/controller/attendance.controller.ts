import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAttendanceController } from "../core/interfaces/controllers/IAttendanceController";
import { IAttendanceService } from "../core/interfaces/services/IAttendanceService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import {
  validateAttendanceQuery,
  validateBatchIdParam,
  validateCreateAttendancePayload,
  validateStudentIdParam,
} from "../validator/attendance.validator";
import { CreateAttendanceDTO } from "../dtos/attendance/attendance.dto";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@injectable()
export class AttendanceController implements IAttendanceController {
  constructor(
    @inject(TYPES.IAttendanceService) private _attendanceService: IAttendanceService
  ) {}

  async getStudentAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateStudentIdParam(req.params.studentId);

      const result = await this._attendanceService.getStudentAttendanceSummary(
        userId,
        req.params.studentId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatchAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateBatchIdParam(req.params.batchId);

      const result = await this._attendanceService.getBatchAttendanceSummary(
        userId,
        req.params.batchId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getLowAttendanceStudents(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateBatchIdParam(req.params.batchId);

      const result = await this._attendanceService.getLowAttendanceStudents(
        userId,
        req.params.batchId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getAttendanceByBatchAndDate(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const { batchId, date } = req.query as { batchId?: string; date?: string };
      validateAttendanceQuery(batchId, date);

      const result = await this._attendanceService.getAttendanceByBatchAndDate(
        userId,
        batchId as string,
        date as string
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async saveAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as CreateAttendanceDTO;
      validateCreateAttendancePayload(payload.batchId, payload.date, payload.records);

      await this._attendanceService.saveAttendance(userId, payload);
      sendResponse(res, StatusCode.OK, "Attendance saved successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
