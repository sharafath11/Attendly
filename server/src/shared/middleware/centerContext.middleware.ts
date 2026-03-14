import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../lib/jwtToken";
import { TokenPayload } from "../../types/authTypes";
import { AuthenticatedRequest } from "./role.middleware";

export const attachCenterContext = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token ?? req.cookies?.adminToken;
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token) as TokenPayload;
    if (decoded?.id) {
      const reqWithAuth = req as AuthenticatedRequest;
      reqWithAuth.user = { ...decoded, userId: decoded.userId ?? decoded.id };
      reqWithAuth.centerId = decoded.centerId;
      reqWithAuth.role = decoded.role;
    }
  } catch {
    // Ignore invalid tokens here; role middleware handles auth enforcement.
  }

  return next();
};
