import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { TYPES } from "../core/types";
import { IDashboardController } from "../core/interfaces/controllers/IDashboardController";
import { IDashboardService } from "../core/interfaces/services/IDashboardService";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class DashboardController implements IDashboardController {
  constructor(
    @inject(TYPES.IDashboardService) private _dashboardService: IDashboardService
  ) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
      }
      const result = await this._dashboardService.getDashboard(scopeId);
      sendResponse(res, StatusCode.OK, "Dashboard data", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
