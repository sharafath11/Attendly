import { Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { TokenPayload } from "../types/authTypes";

dotenv.config()
const SECRET_KEY = process.env.JWT_SECRET || "yourAccessSecret";
const REFRESH_KEY = process.env.REFRESH_SECRET || "yourRefreshSecret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const,
  ...(process.env.COOKIE_DOMAIN
    ? { domain: process.env.COOKIE_DOMAIN }
    : {}),
  path: "/",
};

const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

const logCookieSet = (res: Response, label: string) => {
  if (!AUTH_DEBUG) return;
  const setCookie = res.getHeader("set-cookie");
  const count = Array.isArray(setCookie) ? setCookie.length : setCookie ? 1 : 0;
  console.log(`[AuthDebug] ${label}: set-cookie count=${count}`, {
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    domain: "domain" in cookieOptions ? cookieOptions.domain : undefined,
    path: cookieOptions.path,
  });
};



// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production", 
//   sameSite: "none" as const,                    
//   domain: ".sharafathabi.cloud", 
//   path: "/",                                     
// };

export const generateAccessToken = (id: string, role: string, centerId?: string): string => {
  const payload: TokenPayload = { id, userId: id, role, centerId };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_EXPIRES_IN });
};
export const generateRefreshToken = (id: string, role: string, centerId?: string): string => {
  const payload: TokenPayload = { id, userId: id, role, centerId };
  return jwt.sign(payload, REFRESH_KEY, { expiresIn: REFRESH_EXPIRES_IN });
};
export const verifyAccessToken = (token: string): TokenPayload | null => {
  return jwt.verify(token, SECRET_KEY) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  return jwt.verify(token, REFRESH_KEY) as TokenPayload;
};
export const decodeToken = (token: string): TokenPayload | null => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  return decoded;
};
export const refreshAccessToken = (refreshToken: string) => {
  try {
    if (!refreshToken) return null;
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) return null;

    const newAccessToken = generateAccessToken(decoded.id, decoded.role, decoded.centerId);
    const newRefreshToken = generateRefreshToken(decoded.id, decoded.role, decoded.centerId);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    return null;
  }
};
export const setTokensInCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("token", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);
  logCookieSet(res, "setTokensInCookies");
};

export const clearTokens = (res: Response) => {
  res.clearCookie("token", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  logCookieSet(res, "clearTokens");
};

export const setAdminTokensInCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("adminToken", accessToken, cookieOptions);
  res.cookie("adminRefreshToken", refreshToken, cookieOptions);
  logCookieSet(res, "setAdminTokensInCookies");
};

export const clearAdminTokens = (res: Response) => {
  res.clearCookie("adminToken", cookieOptions);
  res.clearCookie("adminRefreshToken", cookieOptions);
  logCookieSet(res, "clearAdminTokens");
};
