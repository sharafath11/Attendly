import { getRequest, postRequest } from "./api";
import { BlockCenterPayload, UpdatePaymentStatusPayload } from "@/types/admin/adminTypes";

export const adminApi = {
  getDashboard: () => getRequest("/admin/dashboard"),
  getDashboardCharts: () => getRequest("/admin/dashboard/charts"),
  getCenters: () => getRequest("/admin/centers"),
  getCenterById: (id: string) => getRequest(`/admin/centers/${id}`),
  blockCenter: (id: string, payload: BlockCenterPayload) => postRequest(`/admin/centers/${id}/block`, payload),
  unblockCenter: (id: string) => postRequest(`/admin/centers/${id}/unblock`, {}),
  updatePaymentStatus: (id: string, payload: UpdatePaymentStatusPayload) =>
    postRequest(`/admin/centers/${id}/payment-status`, payload),
  verifyCenter: (id: string) => postRequest(`/admin/centers/${id}/verify`, {}),
  rejectCenter: (id: string) => postRequest(`/admin/centers/${id}/reject`, {}),
  verifyUser: (id: string) => postRequest(`/admin/users/${id}/verify`, {}),
  unverifyUser: (id: string) => postRequest(`/admin/users/${id}/unverify`, {}),
};
