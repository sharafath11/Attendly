import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MESSAGES } from "../../const/messages";
import { StatusCode } from "../../enums/statusCode";
import { verifyAccessToken } from "../../lib/jwtToken";
import { TokenPayload } from "../../types/authTypes";
import { sendResponse } from "../../utils/response";
import { UserModel } from "../../models/user.Model";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  authUserId?: string;
  userRole?: "center_owner" | "teacher" | "super_admin";
  centerId?: string;
  role?: string;
  user?: TokenPayload;
}

const normalizeCenterId = (user: { _id: any; centerId?: string | { toString: () => string } | null }) => {
  if (user.centerId) {
    const value = typeof user.centerId === "string" ? user.centerId : user.centerId.toString();
    if (value.trim().length > 0) {
      return value;
    }
  }
  return user._id.toString();
};

export const requireRole =
  (roles: Array<"center_owner" | "teacher" | "super_admin">) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies?.token;

    try {
      if (!accessToken) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const decoded = verifyAccessToken(accessToken) as TokenPayload;
      if (!decoded?.id) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
      }

      if (decoded.role === "super_admin") {
        if (!roles.includes("super_admin")) {
          return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
        }
        const reqWithAuth = req as AuthenticatedRequest;
        reqWithAuth.authUserId = decoded.id;
        reqWithAuth.userRole = "super_admin";
        reqWithAuth.role = decoded.role;
        reqWithAuth.user = { ...decoded, userId: decoded.userId ?? decoded.id };
        return next();
      }

      const user = await UserModel.findById(decoded.id).lean().exec();
      if (!user) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
      }

      if (user.status === "disabled") {
        return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.AUTH.BLOCKED, false);
      }

      const role = user.role ?? "center_owner";
      const allowedRoles = roles;
      if (!allowedRoles.includes(role)) {
        return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
      }

      const centerId = normalizeCenterId(user);
      const reqWithAuth = req as AuthenticatedRequest;
      reqWithAuth.userId = centerId;
      reqWithAuth.authUserId = user._id.toString();
      reqWithAuth.userRole = role as "center_owner" | "teacher" | "super_admin";
      reqWithAuth.centerId = centerId;
      reqWithAuth.role = role;
      reqWithAuth.user = { ...decoded, userId: decoded.userId ?? decoded.id, centerId };

      return next();
    } catch (error) {
      if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
      }

      return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.SERVER_ERROR, false);
    }
  };

export const requireAdminRole =
  (roles: Array<"super_admin">) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const adminToken = req.cookies?.adminToken;
    
    try {
      if (!adminToken) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }
       
      const decodedAdmin = verifyAccessToken(adminToken) as TokenPayload;
      if (!decodedAdmin?.id || decodedAdmin.role !== "super_admin") {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
      }

      if (!roles.includes("super_admin")) {
        return sendResponse(res, StatusCode.FORBIDDEN, MESSAGES.COMMON.ACCESS_DENIED, false);
      }

      const reqWithAuth = req as AuthenticatedRequest;
      reqWithAuth.authUserId = decodedAdmin.id;
      reqWithAuth.userRole = "super_admin";
      reqWithAuth.role = decodedAdmin.role;
      reqWithAuth.user = { ...decodedAdmin, userId: decodedAdmin.userId ?? decodedAdmin.id };

      return next();
    } catch (error) {
      if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
        console.log("[AdminAuth] Token verification failed", {
          name: error.name,
          message: error.message,
        });
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, false);
      }

      console.log("[AdminAuth] Unexpected error", error);
      return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.SERVER_ERROR, false);
    }
  };
