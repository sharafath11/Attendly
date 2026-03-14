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
  validateAttendanceHistoryFilters,
  validateBatchIdParam,
  validateCreateAttendancePayload,
  validateStudentIdParam,
} from "../validator/attendance.validator";
import { CreateAttendanceDTO } from "../dtos/attendance/attendance.dto";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class AttendanceController implements IAttendanceController {
  constructor(
    @inject(TYPES.IAttendanceService) private _attendanceService: IAttendanceService
  ) {}

  async getStudentAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateStudentIdParam(req.params.studentId);

      const result = await this._attendanceService.getStudentAttendanceSummary(
        scopeId,
        req.params.studentId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatchAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateBatchIdParam(req.params.batchId);

      const result = await this._attendanceService.getBatchAttendanceSummary(
        scopeId,
        req.params.batchId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getLowAttendanceStudents(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      validateBatchIdParam(req.params.batchId);

      const result = await this._attendanceService.getLowAttendanceStudents(
        scopeId,
        req.params.batchId
      );
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getAttendanceByBatchAndDate(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const { batchId, date } = req.query as { batchId?: string; date?: string };
      validateAttendanceQuery(batchId, date);

      const result = await this._attendanceService.getAttendanceByBatchAndDate(
        scopeId,
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
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as CreateAttendanceDTO;
      validateCreateAttendancePayload(payload);

      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      await this._attendanceService.saveAttendance(scopeId, authUserId, payload);
      sendResponse(res, StatusCode.OK, "Attendance saved successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getAttendanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const filters = validateAttendanceHistoryFilters(req.query as {
        studentId?: string;
        batchId?: string;
        dateFrom?: string;
        dateTo?: string;
      });

      const records = await this._attendanceService.getAttendanceHistory(scopeId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
