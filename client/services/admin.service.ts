import { adminApi } from "./admin.api";
import { BlockCenterPayload, UpdatePaymentStatusPayload, UpdateUserStatusPayload } from "@/types/admin/adminTypes";

export const adminService = {
  getDashboard: () => adminApi.getDashboard(),
  getDashboardCharts: () => adminApi.getDashboardCharts(),
  getMetrics: () => adminApi.getMetrics(),
  getRevenue: () => adminApi.getRevenue(),
  getUsers: (role?: string) => adminApi.getUsers(role),
  getLogs: () => adminApi.getLogs(),
  getCenters: () => adminApi.getCenters(),
  getCenterById: (id: string) => adminApi.getCenterById(id),
  blockCenter: (id: string, payload: BlockCenterPayload) => adminApi.blockCenter(id, payload),
  unblockCenter: (id: string) => adminApi.unblockCenter(id),
  updatePaymentStatus: (id: string, payload: UpdatePaymentStatusPayload) => adminApi.updatePaymentStatus(id, payload),
  verifyCenter: (id: string) => adminApi.verifyCenter(id),
  rejectCenter: (id: string) => adminApi.rejectCenter(id),
  verifyUser: (id: string) => adminApi.verifyUser(id),
  unverifyUser: (id: string) => adminApi.unverifyUser(id),
  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) => adminApi.updateUserStatus(id, payload),
};
