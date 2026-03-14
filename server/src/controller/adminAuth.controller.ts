import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAdminAuthController } from "../core/interfaces/controllers/IAdminAuthController";
import { IAdminAuthService } from "../core/interfaces/services/IAdminAuthService";
import { TYPES } from "../core/types";
import { handleControllerError, sendResponse, throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import {
  clearAdminTokens,
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  setAdminTokensInCookies,
} from "../lib/jwtToken";

@injectable()
export class AdminAuthController implements IAdminAuthController {
  constructor(
    @inject(TYPES.IAdminAuthService) private _adminAuthService: IAdminAuthService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body ?? {};
      if (!username || !password) {
        throwError("Username and password are required", StatusCode.BAD_REQUEST);
      }

      const result = await this._adminAuthService.login(username, password);
      const tokenPayloadId = result.username;
      const accessToken = generateAccessToken(tokenPayloadId, "super_admin");
      const refreshToken = generateRefreshToken(tokenPayloadId, "super_admin");
      setAdminTokensInCookies(res, accessToken, refreshToken);
      sendResponse(res, StatusCode.OK, "Admin login successful", true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.cookies?.adminToken;
      const decoded = decodeToken(accessToken);
      if (!decoded || decoded.role !== "super_admin") {
        throwError("Invalid admin token", StatusCode.UNAUTHORIZED);
      }
      const result = await this._adminAuthService.me(decoded.id);
      sendResponse(res, StatusCode.OK, "Admin profile", true, result);
    } catch (error) {
      handleControllerError(res, error, StatusCode.UNAUTHORIZED);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      clearAdminTokens(res);
      sendResponse(res, StatusCode.OK, "Admin logout successful", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      console.log("[AdminAuth] Refresh token endpoint hit");
      const refreshToken = req.cookies?.adminRefreshToken;

      if (!refreshToken) {
        console.log("[AdminAuth] No admin refresh token in cookies");
        throwError("Refresh token not found", StatusCode.UNAUTHORIZED);
      }

      console.log("[AdminAuth] Verifying admin refresh token and generating new tokens");
      const tokens = refreshAccessToken(refreshToken);

      if (!tokens) {
        console.log("[AdminAuth] Admin refresh token invalid or expired");
        throwError("Invalid or expired token", StatusCode.UNAUTHORIZED);
      }

      console.log("[AdminAuth] Setting new admin tokens in cookies");
      setAdminTokensInCookies(res, tokens.accessToken, tokens.refreshToken);
      sendResponse(res, StatusCode.OK, "Admin token refreshed successfully", true);
    } catch (error) {
      console.error("[AdminAuth] Refresh token error:", error);
      handleControllerError(res, error, StatusCode.UNAUTHORIZED);
    }
  }
}
