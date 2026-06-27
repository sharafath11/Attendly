import { dashboardApi } from "./dashboard.api";

export const dashboardService = {
  getDashboard: () => dashboardApi.getDashboard(),
  getCompanyAnalytics: () => dashboardApi.getCompanyAnalytics(),
};
