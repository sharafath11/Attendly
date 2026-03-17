import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IAuthController } from "../core/interfaces/controllers/IAuth.Controller";
import { IAuthService } from "../core/interfaces/services/IAuthService";
import { TYPES } from "../core/types";
import { MESSAGES } from "../const/messages";
import { StatusCode } from "../enums/statusCode";
import {
  handleControllerError,
  sendResponse,
  throwError,
} from "../utils/response";
import { validateBodyFields } from "../utils/validateRequest";
import { clearTokens, decodeToken, refreshAccessToken, setTokensInCookies } from "../lib/jwtToken";

const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

const logAuthDebug = (label: string, req: Request) => {
  if (!AUTH_DEBUG) return;
  console.log(`[AuthDebug] ${label}`, {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    host: req.headers.host,
    referer: req.headers.referer,
    cookieNames: Object.keys(req.cookies || {}),
  });
};

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TYPES.IAuthServices) private  _authServices: IAuthService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      logAuthDebug("login:request", req);
      const { email, username, password } = req.body ?? {};
      if (!password || (!email && !username)) {
        throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
      }

      const identifier = (email ?? username) as string;
      const result = await this._authServices.login(identifier, password);
      setTokensInCookies(res,result.tocken,result.refreshToken)
      if (AUTH_DEBUG) {
        console.log("[AuthDebug] login:tokensSet", {
          hasAccessToken: Boolean(result?.tocken),
          hasRefreshToken: Boolean(result?.refreshToken),
        });
      }
      sendResponse(
        res,
        StatusCode.OK,
        MESSAGES.AUTH.LOGIN_SUCCESS,
        true,
        result
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password } = req.body;
      validateBodyFields(req, ["fullName","email", "password"])
      await this._authServices.signup({
        name:fullName,
        email,
        password,
        isVerified:false
      });

      sendResponse(
        res,
        StatusCode.CREATED,
        MESSAGES.AUTH.REGISTRATION_SUCCESS,
        true,
        null
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      validateBodyFields(req, ["email", "otp"]);
      const { email, otp } = req.body;

      await this._authServices.verifyOtp(email, otp);

      sendResponse(
        res,
        StatusCode.OK,
        MESSAGES.AUTH.VERIFICATION_SUCCESS,
        true,
        null
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      validateBodyFields(req, ["email"]);
      const { email } = req.body;

      await this._authServices.resendOtp(email);

      sendResponse(
        res,
        StatusCode.OK,
        MESSAGES.AUTH.OTP_SENT,
        true,
        null
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      logAuthDebug("me:request", req);
      const accessToken = req.cookies.token;
      const decoded = decodeToken(accessToken);
      if (!decoded) throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
      
      const userId = decoded.id;
      const result = await this._authServices.getUser(userId);
      
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error, StatusCode.UNAUTHORIZED);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      logAuthDebug("logout:request", req);
      clearTokens(res);
      sendResponse(res, StatusCode.OK, MESSAGES.AUTH.LOGOUT_SUCCESS, true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async refeshToken(req: Request, res: Response): Promise<void> {
    try {
      logAuthDebug("refresh:request", req);
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        if (AUTH_DEBUG) console.log("[AuthDebug] refresh:noRefreshCookie");
        throwError("Refresh token not found", StatusCode.UNAUTHORIZED);
      }

      if (AUTH_DEBUG) console.log("[AuthDebug] refresh:verify");
      const tokens = refreshAccessToken(refreshToken);
      
      if (!tokens) {
        if (AUTH_DEBUG) console.log("[AuthDebug] refresh:invalid");
        throwError(MESSAGES.AUTH.INVALID_TOKEN, StatusCode.UNAUTHORIZED);
      }

      if (AUTH_DEBUG) console.log("[AuthDebug] refresh:setCookies");
      setTokensInCookies(res, tokens.accessToken, tokens.refreshToken);
      sendResponse(res, StatusCode.OK, "Token refreshed successfully", true);
    } catch (error) {
      if (AUTH_DEBUG) console.error("[AuthDebug] refresh:error", error);
      handleControllerError(res, error, StatusCode.UNAUTHORIZED);
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      logAuthDebug("google:request", req);
      validateBodyFields(req, ["googleToken"]);
      const { googleToken } = req.body;

      const result = await this._authServices.googleAuth(googleToken);
      setTokensInCookies(res, result.tocken, result.refreshToken);
      if (AUTH_DEBUG) {
        console.log("[AuthDebug] google:tokensSet", {
          hasAccessToken: Boolean(result?.tocken),
          hasRefreshToken: Boolean(result?.refreshToken),
        });
      }
      
      sendResponse(
        res,
        StatusCode.OK,
        MESSAGES.AUTH.GOOGLE_AUTH_SUCCESS,
        true,
        result
      );
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
