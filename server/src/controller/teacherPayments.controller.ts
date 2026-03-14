import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ITeacherPaymentsController } from "../core/interfaces/controllers/ITeacherPaymentsController";
import { ITeacherPaymentsService } from "../core/interfaces/services/ITeacherPaymentsService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import {
  validateCreateTeacherPayment,
  validateTeacherPaymentFilters,
} from "../validator/teacherPayments.validator";
import { CreateTeacherPaymentDTO, TeacherPaymentFiltersDTO } from "../dtos/teacherPayments/teacherPayments.dto";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class TeacherPaymentsController implements ITeacherPaymentsController {
  constructor(
    @inject(TYPES.ITeacherPaymentsService) private _teacherPaymentsService: ITeacherPaymentsService
  ) {}

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      if (!authUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateCreateTeacherPayment(req.body as CreateTeacherPaymentDTO);
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

      const filters = validateTeacherPaymentFilters(req.query as unknown as TeacherPaymentFiltersDTO);
      const records = await this._teacherPaymentsService.getPayments(authUserId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, records);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
