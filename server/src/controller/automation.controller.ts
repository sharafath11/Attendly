import { Request, Response } from "express";
import { injectable } from "tsyringe";
import mongoose from "mongoose";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { AutomationSettingsModel } from "../models/automationSettings.model";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class AutomationController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const { centerId } = req as AuthenticatedRequest;
      if (!centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "No center", false);
        return;
      }

      let doc = await AutomationSettingsModel.findOne({ centerId: new mongoose.Types.ObjectId(centerId) })
        .lean()
        .exec();
      if (!doc) {
        await AutomationSettingsModel.create({
          centerId: new mongoose.Types.ObjectId(centerId),
        });
        doc = await AutomationSettingsModel.findOne({ centerId: new mongoose.Types.ObjectId(centerId) })
          .lean()
          .exec();
      }

      sendResponse(res, StatusCode.OK, "OK", true, doc);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async patchSettings(req: Request, res: Response): Promise<void> {
    try {
      const { centerId } = req as AuthenticatedRequest;
      if (!centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "No center", false);
        return;
      }

      const body = req.body ?? {};
      const update: Record<string, unknown> = {};
      if (typeof body.autoFeeGeneration === "boolean") update.autoFeeGeneration = body.autoFeeGeneration;
      if (typeof body.feeReminderEnabled === "boolean") update.feeReminderEnabled = body.feeReminderEnabled;
      if (typeof body.reminderDaysBefore === "number") update.reminderDaysBefore = body.reminderDaysBefore;
      if (typeof body.attendanceAutoDefaultAbsent === "boolean")
        update.attendanceAutoDefaultAbsent = body.attendanceAutoDefaultAbsent;

      const doc = await AutomationSettingsModel.findOneAndUpdate(
        { centerId: new mongoose.Types.ObjectId(centerId) },
        { $set: update },
        { new: true, upsert: true }
      )
        .lean()
        .exec();

      sendResponse(res, StatusCode.OK, "Updated", true, doc);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
