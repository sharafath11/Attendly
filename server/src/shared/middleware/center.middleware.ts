import { Request, Response, NextFunction } from "express";
import { CenterModel } from "../../models/center.model";
import { AuthenticatedRequest } from "./role.middleware";
import { MESSAGES } from "../../const/messages";
import { StatusCode } from "../../enums/statusCode";

export const checkCenterBlocked = async (req: Request, res: Response, next: NextFunction) => {
  const { centerId } = req as AuthenticatedRequest;
  if (!centerId) {
    return res.status(StatusCode.UNAUTHORIZED).json({ message: MESSAGES.AUTH.AUTH_REQUIRED });
  }

  const center = await CenterModel.findById(centerId).lean().exec();
  if (!center) {
    return res.status(StatusCode.UNAUTHORIZED).json({ message: "Center not found" });
  }

  if (center.blocked || center.subscriptionStatus === "blocked") {
    return res.status(StatusCode.FORBIDDEN).json({
      message: "Your center account has been blocked by admin.",
      reason: center.blockedReason ?? "Contact platform administrator",
    });
  }

  return next();
};
