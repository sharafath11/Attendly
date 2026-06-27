import { getRequest, postRequest, putRequest } from "./api";
import { ParentListResponse } from "@/types/parent/parentTypes";

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

  // Child-specific portal endpoints
  getMyChildren: () => getRequest<{ ok: boolean; data: any[] }>("/parent/my-children"),
  getChildFees: (studentId: string) => getRequest<{ ok: boolean; data: any[] }>(`/parent/child/${studentId}/fees`),
  getChildAttendance: (studentId: string) => getRequest<{ ok: boolean; data: any[] }>(`/parent/child/${studentId}/attendance`),
  getChildReports: (studentId: string) => getRequest<{ ok: boolean; data: any }>(`/parent/child/${studentId}/reports`),
  getMyNotifications: () => getRequest<{ ok: boolean; data: any[] }>("/parent/inbox"),

  // Owner endpoints
  getOwnerParents: (params: { page?: number; limit?: number; search?: string }) =>
    getRequest<{ ok: boolean; data: ParentListResponse }>("/parents/owner/list", params),
  toggleParentAccess: (parentId: string, status: "active" | "disabled") =>
    putRequest<{ ok: boolean; msg: string; data?: unknown }>(`/parents/owner/${parentId}/status`, { status }),
  bulkBroadcast: (parentIds: string[], message: string) =>
    postRequest<{ ok: boolean; msg: string }>("/parents/owner/broadcast", { parentIds, message }),
  universalBroadcast: (targetAudience: string, messageTemplate: string, batchId?: string) =>
    postRequest<{ ok: boolean; msg: string }>("/parents/owner/universal-broadcast", { targetAudience, messageTemplate, batchId }),
};
