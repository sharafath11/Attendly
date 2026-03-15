import { getRequest, postRequest } from "./api";
import {
  AdminCharts,
  AdminCenter,
  AdminCenterDetail,
  AdminDashboard,
  ApiResponse,
  BlockCenterPayload,
  UpdatePaymentStatusPayload,
} from "@/types/admin/adminTypes";

export const adminApi = {
  getDashboard: () => getRequest<ApiResponse<AdminDashboard>>("/admin/dashboard"),
  getDashboardCharts: () => getRequest<ApiResponse<AdminCharts>>("/admin/dashboard/charts"),
  getCenters: () => getRequest<ApiResponse<AdminCenter[]>>("/admin/centers"),
  getCenterById: (id: string) => getRequest<ApiResponse<AdminCenterDetail>>(`/admin/centers/${id}`),
  blockCenter: (id: string, payload: BlockCenterPayload) =>
    postRequest<ApiResponse<any>>(`/admin/centers/${id}/block`, payload),
  unblockCenter: (id: string) => postRequest<ApiResponse<any>>(`/admin/centers/${id}/unblock`, {}),
  updatePaymentStatus: (id: string, payload: UpdatePaymentStatusPayload) =>
    postRequest<ApiResponse<any>>(`/admin/centers/${id}/payment-status`, payload),
  verifyCenter: (id: string) => postRequest<ApiResponse<any>>(`/admin/centers/${id}/verify`, {}),
  rejectCenter: (id: string) => postRequest<ApiResponse<any>>(`/admin/centers/${id}/reject`, {}),
  verifyUser: (id: string) => postRequest<ApiResponse<any>>(`/admin/users/${id}/verify`, {}),
  unverifyUser: (id: string) => postRequest<ApiResponse<any>>(`/admin/users/${id}/unverify`, {}),
};
