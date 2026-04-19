import {
  AdminDashboardChartsDTO,
  AdminDashboardDTO,
  AdminLogsDTO,
  AdminPlatformMetricsDTO,
  AdminRevenueDTO,
  AdminUserRowDTO,
  BlockCenterDTO,
  UpdatePaymentStatusDTO,
  UpdateUserStatusDTO,
} from "../../../dtos/admin/admin.dto";
import { CenterResponseDTO } from "../../../dtos/centers/centers.dto";

export interface IAdminService {
  getDashboard(): Promise<AdminDashboardDTO>;
  getDashboardCharts(): Promise<AdminDashboardChartsDTO>;
  getPlatformMetrics(): Promise<AdminPlatformMetricsDTO>;
  getRevenueAnalytics(): Promise<AdminRevenueDTO>;
  listUsers(role?: string): Promise<AdminUserRowDTO[]>;
  getLogs(): Promise<AdminLogsDTO>;
  listCenters(): Promise<(CenterResponseDTO & { owner?: { id: string; name: string; email: string } })[]>;
  getCenterById(centerId: string): Promise<CenterResponseDTO & { owner?: { id: string; name: string; email: string }; totalStudents: number; totalTeachers: number }>;
  blockCenter(centerId: string, payload: BlockCenterDTO): Promise<CenterResponseDTO>;
  unblockCenter(centerId: string): Promise<CenterResponseDTO>;
  updatePaymentStatus(centerId: string, payload: UpdatePaymentStatusDTO): Promise<CenterResponseDTO>;
  verifyCenter(centerId: string): Promise<CenterResponseDTO>;
  rejectCenter(centerId: string): Promise<CenterResponseDTO>;
  verifySubscriptionPayment(centerId: string): Promise<CenterResponseDTO>;
  rejectSubscriptionPayment(centerId: string): Promise<CenterResponseDTO>;
  verifyUser(userId: string): Promise<{ id: string; isVerified: boolean }>;
  unverifyUser(userId: string): Promise<{ id: string; isVerified: boolean }>;
  updateUserStatus(userId: string, payload: UpdateUserStatusDTO): Promise<{ id: string; status: string }>;
}
