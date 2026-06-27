import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ITeacherController } from "../../core/interfaces/controllers/ITeacherController";
import { ITeacherAttendanceController } from "../../core/interfaces/controllers/ITeacherAttendanceController";
import { ITeacherPaymentsController } from "../../core/interfaces/controllers/ITeacherPaymentsController";
import { ITeacherService } from "../../core/interfaces/services/ITeacherService";
import { ITeacherAttendanceService } from "../../core/interfaces/services/ITeacherAttendanceService";
import { ITeacherPaymentsService } from "../../core/interfaces/services/ITeacherPaymentsService";
import { TYPES } from "../../core/types";
import { handleControllerError, sendResponse, throwError } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import {
  validateCreateTeacher,
  validateTeacherIdParam,
  validateTeacherStatusUpdate,
  validateUpdateTeacher,
} from "../../validator/teacher.validator";
import {
  validateCreateTeacherAttendance,
  validateTeacherAttendanceFilters,
} from "../../validator/teacherAttendance.validator";
import {
  validateCreateTeacherPayment,
  validateTeacherPaymentFilters,
} from "../../validator/teacherPayments.validator";
import { CreateTeacherAttendanceDTO, TeacherAttendanceFiltersDTO } from "../../dtos/teacherAttendance/teacherAttendance.dto";
import { CreateTeacherPaymentDTO, TeacherPaymentFiltersDTO } from "../../dtos/teacherPayments/teacherPayments.dto";
import { AuthenticatedRequest } from "../../shared/middleware/role.middleware";
import { MESSAGES } from "../../const/messages";
import { getStringParam } from "../../utils/http";

@injectable()
export class TeacherController implements ITeacherController, ITeacherAttendanceController, ITeacherPaymentsController {
  constructor(
    @inject(TYPES.ITeacherService) private _teacherService: ITeacherService,
    @inject(TYPES.ITeacherAttendanceService) private _teacherAttendanceService: ITeacherAttendanceService,
    @inject(TYPES.ITeacherPaymentsService) private _teacherPaymentsService: ITeacherPaymentsService
  ) {}

  // === Core ===

  async createTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      validateCreateTeacher(req.body);
      const result = await this._teacherService.createTeacher(authUserId, req.body);
      sendResponse(res, StatusCode.CREATED, "Teacher account created successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getTeachers(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const result = await this._teacherService.getTeachers(authUserId);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getTeacherById(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const teacherId = getStringParam(req.params.id);
      validateTeacherIdParam(teacherId);
      const result = await this._teacherService.getTeacherById(authUserId, teacherId as string);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const teacherId = getStringParam(req.params.id);
      validateTeacherIdParam(teacherId);
      await this._teacherService.deleteTeacher(authUserId, teacherId as string);
      sendResponse(res, StatusCode.OK, "Teacher account removed successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateTeacherStatus(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const teacherId = getStringParam(req.params.id);
      validateTeacherIdParam(teacherId);
      validateTeacherStatusUpdate(req.body);
      const result = await this._teacherService.updateTeacherStatus(authUserId, teacherId as string, req.body);
      sendResponse(res, StatusCode.OK, "Teacher status updated successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const teacherId = getStringParam(req.params.id);
      validateTeacherIdParam(teacherId);
      validateUpdateTeacher(req.body);
      const result = await this._teacherService.updateTeacher(authUserId, teacherId as string, req.body);
      sendResponse(res, StatusCode.OK, "Teacher updated successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async resetTeacherPassword(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      }

      const teacherId = getStringParam(req.params.id);
      validateTeacherIdParam(teacherId);
      const result = await this._teacherService.resetTeacherPassword(authUserId, teacherId as string);
      sendResponse(res, StatusCode.OK, "Teacher password reset", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  // === Attendance ===

  async saveAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const teacherId = req.params.id || req.body.teacherId;
      const payload = validateCreateTeacherAttendance({
        ...req.body,
        teacherId,
      } as CreateTeacherAttendanceDTO);
      const record = await this._teacherAttendanceService.saveAttendance(authUserId, payload);
      sendResponse(res, StatusCode.OK, "Teacher attendance saved", true, record);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const teacherId = req.params.id || req.query.teacherId;
      const filters = validateTeacherAttendanceFilters({
        ...req.query,
        teacherId,
      } as unknown as TeacherAttendanceFiltersDTO);
      const records = await this._teacherAttendanceService.getAttendance(authUserId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  // === Payments ===

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const teacherId = req.params.id || req.body.teacherId;
      const payload = validateCreateTeacherPayment({
        ...req.body,
        teacherId,
      } as CreateTeacherPaymentDTO);
      const result = await this._teacherPaymentsService.createPayment(authUserId, payload);
      sendResponse(res, StatusCode.OK, "Teacher payment recorded", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const teacherId = req.params.id || req.query.teacherId;
      const filters = validateTeacherPaymentFilters({
        ...req.query,
        teacherId,
      } as unknown as TeacherPaymentFiltersDTO);
      const records = await this._teacherPaymentsService.getPayments(authUserId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
