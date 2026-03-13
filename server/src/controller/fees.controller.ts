import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IFeesController } from "../core/interfaces/controllers/IFeesController";
import { IFeesService } from "../core/interfaces/services/IFeesService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import {
  validateFeeFilters,
  validateMarkFeePaid,
  validatePendingFeesQuery,
  validateUpdateFeeStatus,
} from "../validator/fees.validator";
import { FeeFiltersDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../dtos/fees/fees.dto";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@injectable()
export class FeesController implements IFeesController {
  constructor(@inject(TYPES.IFeesService) private _feesService: IFeesService) {}

  async getFees(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const filters = validateFeeFilters(req.query as unknown as FeeFiltersDTO);
      const fees = await this._feesService.getFees(userId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, fees);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async markFeePaid(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as MarkFeePaidDTO;
      validateMarkFeePaid(payload);

      await this._feesService.markFeePaid(userId, payload);
      sendResponse(res, StatusCode.OK, "Fee marked as paid", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateFeeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as UpdateFeeStatusDTO;
      validateUpdateFeeStatus(payload);

      await this._feesService.updateFeeStatus(userId, payload);
      sendResponse(res, StatusCode.OK, "Fee status updated", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getPendingFees(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const { month, year } = validatePendingFeesQuery(
        req.query?.month as string | undefined,
        req.query?.year as string | undefined
      );

      const fees = await this._feesService.getPendingFees(userId, month, year);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, fees);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
