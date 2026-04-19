import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { NotificationOrchestratorService } from "../services/notificationOrchestrator.service";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class NotificationController {
  constructor(private _notifications: NotificationOrchestratorService) {}

  async feeReminder(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { centerId, authUserId } = req as AuthenticatedRequest;
      if (!studentId || !centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Missing fields", false);
        return;
      }
      await this._notifications.sendFeeReminder(centerId, studentId, authUserId);
      sendResponse(res, StatusCode.OK, "Reminder queued", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async attendanceAlert(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, date, status } = req.body ?? {};
      const { centerId, authUserId } = req as AuthenticatedRequest;
      if (!studentId || !date || !status || !centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "studentId, date, status required", false);
        return;
      }
      await this._notifications.sendAttendanceAlert(centerId, studentId, String(date), String(status), authUserId);
      sendResponse(res, StatusCode.OK, "Alert queued", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body ?? {};
      const { centerId, authUserId } = req as AuthenticatedRequest;
      if (!message || !centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "message required", false);
        return;
      }
      const result = await this._notifications.sendBroadcast(centerId, String(message), authUserId);
      sendResponse(res, StatusCode.OK, "Broadcast finished", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
