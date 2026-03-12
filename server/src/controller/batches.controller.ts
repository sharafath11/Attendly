import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IBatchesController } from "../core/interfaces/controllers/IBatchesController";
import { IBatchesService } from "../core/interfaces/services/IBatchesService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import { validateBatchFilters, validateCreateBatch, validateUpdateBatch } from "../validator/batches.validator";
import { BatchFiltersDTO, CreateBatchDTO, UpdateBatchDTO } from "../dtos/batches/batches.dto";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@injectable()
export class BatchesController implements IBatchesController {
  constructor(
    @inject(TYPES.IBatchesService) private _batchesService: IBatchesService
  ) {}

  async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateCreateBatch(req.body as CreateBatchDTO);
      const batch = await this._batchesService.createBatch(userId, payload);

      sendResponse(res, StatusCode.CREATED, "Batch created successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatches(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const filters = validateBatchFilters(req.query as unknown as BatchFiltersDTO);
      const result = await this._batchesService.getBatches(userId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const batch = await this._batchesService.getBatchById(userId, req.params.id);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateUpdateBatch(req.body as UpdateBatchDTO);
      const batch = await this._batchesService.updateBatch(userId, req.params.id, payload);
      sendResponse(res, StatusCode.OK, "Batch updated successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      await this._batchesService.deleteBatch(userId, req.params.id);
      sendResponse(res, StatusCode.OK, "Batch deleted successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
