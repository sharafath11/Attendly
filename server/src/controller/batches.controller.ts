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
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class BatchesController implements IBatchesController {
  constructor(
    @inject(TYPES.IBatchesService) private _batchesService: IBatchesService
  ) {}

  async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateCreateBatch(req.body as CreateBatchDTO);
      const batch = await this._batchesService.createBatch(scopeId, payload);

      sendResponse(res, StatusCode.CREATED, "Batch created successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatches(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const filters = validateBatchFilters(req.query as unknown as BatchFiltersDTO);
      const result = await this._batchesService.getBatches(scopeId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const batch = await this._batchesService.getBatchById(scopeId, req.params.id);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateUpdateBatch(req.body as UpdateBatchDTO);
      const batch = await this._batchesService.updateBatch(scopeId, req.params.id, payload);
      sendResponse(res, StatusCode.OK, "Batch updated successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      await this._batchesService.deleteBatch(scopeId, req.params.id);
      sendResponse(res, StatusCode.OK, "Batch deleted successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
