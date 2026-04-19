import { getRequest, postRequest } from "./api";

export const parentApi = {
  requestOtp: (body: { phone: string; centerId?: string }) =>
    postRequest<{ ok: boolean; data?: unknown }>("/parent/auth/request-otp", body),
  verifyOtp: (body: { phone: string; otp: string; centerId?: string }) =>
    postRequest<{ ok: boolean; data?: { user?: unknown } }>("/parent/auth/verify-otp", body),
  logout: () => postRequest("/parent/auth/logout", {}),
  me: () => getRequest<{ ok: boolean; data?: unknown }>("/parent/me"),
  dashboard: () => getRequest<{ ok: boolean; data?: unknown }>("/parent/dashboard"),
  attendance: () => getRequest<{ ok: boolean; data?: unknown }>("/parent/attendance"),
  fees: () => getRequest<{ ok: boolean; data?: unknown }>("/parent/fees"),
  notifications: () => getRequest<{ ok: boolean; data?: unknown }>("/parent/notifications"),
};
