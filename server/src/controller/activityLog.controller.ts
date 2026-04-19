import { Request, Response } from "express";
import { injectable } from "tsyringe";
import mongoose from "mongoose";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { ActivityLogModel } from "../models/activityLog.model";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class ActivityLogController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { centerId } = req as AuthenticatedRequest;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      if (!centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "No center", false);
        return;
      }

      const rows = await ActivityLogModel.find({ centerId: new mongoose.Types.ObjectId(centerId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      sendResponse(
        res,
        StatusCode.OK,
        "OK",
        true,
        rows.map((r) => ({
          id: r._id.toString(),
          action: r.action,
          entityType: r.entityType,
          entityId: r.entityId?.toString(),
          summary: r.summary,
          meta: r.meta,
          createdAt: r.createdAt,
        }))
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
