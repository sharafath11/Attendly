import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAdminController } from "../core/interfaces/controllers/IAdminController";
import { IAdminService } from "../core/interfaces/services/IAdminService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { validateBlockCenter, validateCenterIdParam, validateUpdatePaymentStatus, validateUserIdParam } from "../validator/admin.validator";

@injectable()
export class AdminController implements IAdminController {
  constructor(
    @inject(TYPES.IAdminService) private _adminService: IAdminService
  ) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._adminService.getDashboard();
      sendResponse(res, StatusCode.OK, "Admin dashboard data", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getDashboardCharts(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._adminService.getDashboardCharts();
      sendResponse(res, StatusCode.OK, "Admin chart data", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async listCenters(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._adminService.listCenters();
      sendResponse(res, StatusCode.OK, "Centers fetched successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getCenterById(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      const result = await this._adminService.getCenterById(req.params.id);
      sendResponse(res, StatusCode.OK, "Center details", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async blockCenter(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      validateBlockCenter(req.body);
      const result = await this._adminService.blockCenter(req.params.id, req.body);
      sendResponse(res, StatusCode.OK, "Center blocked successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async unblockCenter(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      const result = await this._adminService.unblockCenter(req.params.id);
      sendResponse(res, StatusCode.OK, "Center unblocked successfully", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      validateUpdatePaymentStatus(req.body);
      const result = await this._adminService.updatePaymentStatus(req.params.id, req.body);
      sendResponse(res, StatusCode.OK, "Payment status updated", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verifyCenter(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      const result = await this._adminService.verifyCenter(req.params.id);
      sendResponse(res, StatusCode.OK, "Center verified", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async rejectCenter(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.id);
      const result = await this._adminService.rejectCenter(req.params.id);
      sendResponse(res, StatusCode.OK, "Center rejected", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verifySubscriptionPayment(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.centerId);
      const result = await this._adminService.verifySubscriptionPayment(req.params.centerId);
      sendResponse(res, StatusCode.OK, "Subscription activated successfully.", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async rejectSubscriptionPayment(req: Request, res: Response): Promise<void> {
    try {
      validateCenterIdParam(req.params.centerId);
      const result = await this._adminService.rejectSubscriptionPayment(req.params.centerId);
      sendResponse(res, StatusCode.OK, "Payment not verified.", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verifyUser(req: Request, res: Response): Promise<void> {
    try {
      validateUserIdParam(req.params.id);
      const result = await this._adminService.verifyUser(req.params.id);
      sendResponse(res, StatusCode.OK, "User verified", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async unverifyUser(req: Request, res: Response): Promise<void> {
    try {
      validateUserIdParam(req.params.id);
      const result = await this._adminService.unverifyUser(req.params.id);
      sendResponse(res, StatusCode.OK, "User unverified", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
