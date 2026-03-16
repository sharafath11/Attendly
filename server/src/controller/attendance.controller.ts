import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAttendanceController } from "../core/interfaces/controllers/IAttendanceController";
import { IAttendanceService } from "../core/interfaces/services/IAttendanceService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse, throwError } from "../utils/response";
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
import { getStringParam } from "../utils/http";

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

      const studentId = getStringParam(req.params.studentId);
      validateStudentIdParam(studentId);
      if (!studentId) {
        throwError("Invalid student id", StatusCode.BAD_REQUEST);
      }

      const result = await this._attendanceService.getStudentAttendanceSummary(
        scopeId,
        studentId as string
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

      const batchId = getStringParam(req.params.batchId);
      validateBatchIdParam(batchId);
      if (!batchId) {
        throwError("Invalid batch id", StatusCode.BAD_REQUEST);
      }

      const result = await this._attendanceService.getBatchAttendanceSummary(
        scopeId,
        batchId as string
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

      const batchId = getStringParam(req.params.batchId);
      validateBatchIdParam(batchId);
      if (!batchId) {
        throwError("Invalid batch id", StatusCode.BAD_REQUEST);
      }

      const result = await this._attendanceService.getLowAttendanceStudents(
        scopeId,
        batchId as string
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

      const batchId = getStringParam(req.query.batchId);
      const date = getStringParam(req.query.date);
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

      const filters = validateAttendanceHistoryFilters({
        studentId: getStringParam(req.query.studentId),
        batchId: getStringParam(req.query.batchId),
        dateFrom: getStringParam(req.query.dateFrom),
        dateTo: getStringParam(req.query.dateTo),
      });

      const records = await this._attendanceService.getAttendanceHistory(scopeId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
