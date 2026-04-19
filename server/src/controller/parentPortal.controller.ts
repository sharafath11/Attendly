import { Response } from "express";
import { injectable } from "tsyringe";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { ParentPortalService } from "../services/parentPortal.service";
import { ParentRequest } from "../shared/middleware/parent.middleware";
import { normalizePhoneDigits } from "../utils/phone.util";

@injectable()
export class ParentPortalController {
  constructor(private _portal: ParentPortalService) {}

  async dashboard(req: ParentRequest, res: Response): Promise<void> {
    try {
      const phone = normalizePhoneDigits(req.parentPhone ?? "");
      const data = await this._portal.getDashboard(req.parentCenterId!, phone);
      sendResponse(res, StatusCode.OK, "OK", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async attendance(req: ParentRequest, res: Response): Promise<void> {
    try {
      const phone = normalizePhoneDigits(req.parentPhone ?? "");
      const data = await this._portal.getAttendance(req.parentCenterId!, phone);
      sendResponse(res, StatusCode.OK, "OK", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async fees(req: ParentRequest, res: Response): Promise<void> {
    try {
      const phone = normalizePhoneDigits(req.parentPhone ?? "");
      const data = await this._portal.getFees(req.parentCenterId!, phone);
      sendResponse(res, StatusCode.OK, "OK", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async notifications(req: ParentRequest, res: Response): Promise<void> {
    try {
      const data = await this._portal.getNotifications(req.parentCenterId!, req.parentUserId!);
      sendResponse(res, StatusCode.OK, "OK", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
