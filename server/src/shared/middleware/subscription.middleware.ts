import { Request, Response, NextFunction } from "express";
import { CenterModel } from "../../models/center.model";
import { StatusCode } from "../../enums/statusCode";
import { sendResponse } from "../../utils/response";
import { AuthenticatedRequest } from "./role.middleware";

export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  const { centerId, userId } = req as AuthenticatedRequest;
  const scopeId = centerId ?? userId;

  if (!scopeId) {
    return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
  }

  const center = await CenterModel.findById(scopeId).lean().exec();
  if (!center) {
    return sendResponse(res, StatusCode.NOT_FOUND, "Center not found", false);
  }

  if (center.blocked) {
    return res.status(StatusCode.FORBIDDEN).json({
      message: "Your center account has been blocked.",
      reason: center.blockedReason ?? "Contact platform administrator",
    });
  }

  if (center.subscriptionStatus !== "active") {
    return res.status(StatusCode.FORBIDDEN).json({
      message: "Your subscription is not active.",
      action: "Please complete payment and wait for admin verification.",
    });
  }

  return next();
};
