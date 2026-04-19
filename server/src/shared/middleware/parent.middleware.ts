import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "../../lib/jwtToken";
import { UserModel } from "../../models/user.Model";
import { sendResponse } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";

export interface ParentRequest extends Request {
  parentUserId?: string;
  parentCenterId?: string;
  parentPhone?: string;
}

export const requireParentAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.parentToken;

  try {
    if (!token) {
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.id || decoded.role !== "parent") {
      return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
    }

    const user = await UserModel.findById(decoded.id).lean().exec();
    if (!user || user.role !== "parent" || user.status === "disabled") {
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
    }

    const centerId = user.centerId ? user.centerId.toString() : decoded.centerId;
    if (!centerId) {
      return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
    }

    const r = req as ParentRequest;
    r.parentUserId = user._id.toString();
    r.parentCenterId = centerId;
    r.parentPhone = user.phone ?? undefined;

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
    }
    return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.SERVER_ERROR, false);
  }
};
