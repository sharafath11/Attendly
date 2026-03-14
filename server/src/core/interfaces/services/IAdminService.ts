import { AdminDashboardChartsDTO, AdminDashboardDTO, BlockCenterDTO, UpdatePaymentStatusDTO } from "../../../dtos/admin/admin.dto";
import { CenterResponseDTO } from "../../../dtos/centers/centers.dto";

export interface IAdminService {
  getDashboard(): Promise<AdminDashboardDTO>;
  getDashboardCharts(): Promise<AdminDashboardChartsDTO>;
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
}
