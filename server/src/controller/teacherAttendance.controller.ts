import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ITeacherAttendanceController } from "../core/interfaces/controllers/ITeacherAttendanceController";
import { ITeacherAttendanceService } from "../core/interfaces/services/ITeacherAttendanceService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import {
  validateCreateTeacherAttendance,
  validateTeacherAttendanceFilters,
} from "../validator/teacherAttendance.validator";
import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
} from "../dtos/teacherAttendance/teacherAttendance.dto";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class TeacherAttendanceController implements ITeacherAttendanceController {
  constructor(
    @inject(TYPES.ITeacherAttendanceService) private _teacherAttendanceService: ITeacherAttendanceService
  ) {}

  async saveAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateCreateTeacherAttendance(req.body as CreateTeacherAttendanceDTO);
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

      const filters = validateTeacherAttendanceFilters(req.query as unknown as TeacherAttendanceFiltersDTO);
      const records = await this._teacherAttendanceService.getAttendance(authUserId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
