import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";
import { verifyAccessToken } from "../../lib/jwtToken";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { TokenPayload } from "../../types/authTypes";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.token;

  if (!accessToken) {
    return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
  }

  try {
    const decoded = verifyAccessToken(accessToken) as TokenPayload;

    if (decoded?.id && decoded.role === "user") {
      (req as AuthenticatedRequest).userId = decoded.id;
      return next();
    }

    return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
  } catch (error) {
    if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
    }

    return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.SERVER_ERROR, false);
  }
};
