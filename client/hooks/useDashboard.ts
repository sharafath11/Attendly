import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type { ApiResponse, DashboardData } from "@/types/dashboard/dashboardTypes";

export const useDashboard = () => {
  return useQuery<ApiResponse<DashboardData> | null>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboard(),
    placeholderData: keepPreviousData,
  });
};
