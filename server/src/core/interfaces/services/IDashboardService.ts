import { DashboardDTO } from "../../../dtos/dashboard/dashboard.dto";

export interface IDashboardService {
  getDashboard(centerId: string): Promise<DashboardDTO>;
}
