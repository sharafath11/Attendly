import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { ICenterController } from "../core/interfaces/controllers/ICenterController";
import { ICenterService } from "../core/interfaces/services/ICenterService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { validateCenterRegistration } from "../validator/center.validator";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class CenterController implements ICenterController {
  constructor(
    @inject(TYPES.ICenterService) private _centerService: ICenterService
  ) {}

  async registerCenter(req: Request, res: Response): Promise<void> {
    try {
      validateCenterRegistration(req.body);
      await this._centerService.registerCenter(req.body);
      sendResponse(res, StatusCode.CREATED, "Registration successful. Waiting for admin approval.", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getCenterStatus(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
      }
      const result = await this._centerService.getCenterStatus(scopeId);
      sendResponse(res, StatusCode.OK, "Center status", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getMyCenter(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
      }
      const result = await this._centerService.getMyCenter(scopeId);
      sendResponse(res, StatusCode.OK, "Center subscription details", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
