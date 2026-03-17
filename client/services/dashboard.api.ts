import { getRequest } from "./api";
import type { ApiResponse, DashboardData } from "@/types/dashboard/dashboardTypes";

export const dashboardApi = {
  getDashboard: () => getRequest<ApiResponse<DashboardData>>("/dashboard"),
};
