import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import { verifyAccessToken } from "../lib/jwtToken";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { TokenPayload } from "../types/authTypes";

const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies?.token;
  
  if (!accessToken) {
    if (AUTH_DEBUG) {
      console.log("[AuthDebug] middleware:noAccessToken", {
        path: req.path,
        cookieNames: Object.keys(req.cookies || {}),
      });
    }
    return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
  }

  try {
    const decoded = verifyAccessToken(accessToken) as TokenPayload;
    if (AUTH_DEBUG) {
      console.log("[AuthDebug] middleware:tokenDecoded", {
        hasId: Boolean(decoded?.id),
        role: decoded?.role,
      });
    }
    const role = decoded?.role === "owner" ? "center_owner" : decoded?.role;
    if (decoded?.id && ["center_owner", "teacher", "super_admin"].includes(role)) {
      if (AUTH_DEBUG) {
        console.log("[AuthDebug] middleware:authorized", {
          userId: decoded.id,
          role,
        });
      }
      (req as any).user = { ...decoded, role };
      return next();
    }

    if (AUTH_DEBUG) {
      console.log("[AuthDebug] middleware:forbiddenRole", {
        role: decoded?.role,
      });
    }
    return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      if (AUTH_DEBUG) console.log("[AuthDebug] middleware:tokenExpired");
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
    }

    if (error instanceof JsonWebTokenError) {
      if (AUTH_DEBUG) console.log("[AuthDebug] middleware:invalidToken");
      return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
    }

    if (AUTH_DEBUG) console.error("[AuthDebug] middleware:unexpectedError", error);
    return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.SERVER_ERROR, false);
  }
};
