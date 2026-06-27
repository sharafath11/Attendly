import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./role.middleware";
import { StatusCode } from "../../enums/statusCode";

/**
 * Ensures that a valid centerId (tenant context) is present on the request.
 * Should be placed after roleGuard or any auth middleware.
 */
export const tenantGuard = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.centerId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      ok: false,
      msg: "Access denied - Tenant identification missing",
    });
  }
  next();
};
