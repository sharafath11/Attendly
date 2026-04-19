import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { ParentAuthService } from "../services/parentAuth.service";
import { setParentTokensInCookies, clearParentTokens, refreshAccessToken, verifyRefreshToken } from "../lib/jwtToken";
import { ParentRequest } from "../shared/middleware/parent.middleware";

@injectable()
export class ParentAuthController {
  constructor(private _parentAuth: ParentAuthService) {}

  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, centerId } = req.body ?? {};
      if (!phone) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Phone is required", false);
        return;
      }
      const result = await this._parentAuth.requestOtp(String(phone), centerId ? String(centerId) : undefined);
      if ("needsCenterPick" in result && result.needsCenterPick) {
        sendResponse(res, StatusCode.OK, "Select a center", true, result);
        return;
      }
      sendResponse(res, StatusCode.OK, "OTP sent", true, {
        centerId: result.centerId,
        devOtp: result.devOtp,
      });
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, otp, centerId } = req.body ?? {};
      if (!phone || !otp) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Phone and OTP are required", false);
        return;
      }
      const result = await this._parentAuth.verifyOtp(String(phone), String(otp), centerId ? String(centerId) : undefined);
      setParentTokensInCookies(res, result.accessToken, result.refreshToken);
      sendResponse(res, StatusCode.OK, "Logged in", true, { user: result.user });
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    clearParentTokens(res);
    sendResponse(res, StatusCode.OK, "Logged out", true);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.parentRefreshToken;
      if (!refreshToken) {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Refresh token not found", false);
        return;
      }
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || decoded.role !== "parent") {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Invalid token", false);
        return;
      }
      const tokens = refreshAccessToken(refreshToken);
      if (!tokens?.accessToken || !tokens.refreshToken) {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Invalid token", false);
        return;
      }
      setParentTokensInCookies(res, tokens.accessToken, tokens.refreshToken);
      sendResponse(res, StatusCode.OK, "Token refreshed", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const r = req as ParentRequest;
      sendResponse(res, StatusCode.OK, "OK", true, {
        user: {
          id: r.parentUserId,
          centerId: r.parentCenterId,
          phone: r.parentPhone,
          role: "parent",
        },
      });
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
