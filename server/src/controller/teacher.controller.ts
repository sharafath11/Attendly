import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ITeacherController } from "../core/interfaces/controllers/ITeacherController";
import { ITeacherService } from "../core/interfaces/services/ITeacherService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse, throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import {
  validateCreateTeacher,
  validateTeacherIdParam,
  validateTeacherStatusUpdate,
  validateUpdateTeacher,
} from "../validator/teacher.validator";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { MESSAGES } from "../const/messages";

@injectable()
export class TeacherController implements ITeacherController {
  constructor(
    @inject(TYPES.ITeacherService) private _teacherService: ITeacherService
  ) {}

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

      validateTeacherIdParam(req.params.id);
      const result = await this._teacherService.getTeacherById(authUserId, req.params.id);
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

      validateTeacherIdParam(req.params.id);
      await this._teacherService.deleteTeacher(authUserId, req.params.id);
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

      validateTeacherIdParam(req.params.id);
      validateTeacherStatusUpdate(req.body);
      const result = await this._teacherService.updateTeacherStatus(authUserId, req.params.id, req.body);
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

      validateTeacherIdParam(req.params.id);
      validateUpdateTeacher(req.body);
      const result = await this._teacherService.updateTeacher(authUserId, req.params.id, req.body);
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

      validateTeacherIdParam(req.params.id);
      const result = await this._teacherService.resetTeacherPassword(authUserId, req.params.id);
      sendResponse(res, StatusCode.OK, "Teacher password reset", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
