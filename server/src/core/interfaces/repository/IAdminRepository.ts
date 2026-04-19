import { ICenter } from "../../../models/center.model";
import { CenterDocument } from "../../../models/center.model";
import { IBaseRepository } from "./IBaseRepository";
import { AdminRepositoryData } from "../../../types/adminTypes";
import {
  AdminLogsDTO,
  AdminPlatformMetricsDTO,
  AdminRevenueDTO,
  AdminUserRowDTO,
} from "../../../dtos/admin/admin.dto";

export interface IAdminRepository extends IBaseRepository<CenterDocument, ICenter> {
  getDashboardStats(): Promise<AdminRepositoryData>;
  getPlatformAnalytics(): Promise<AdminPlatformMetricsDTO>;
  getRevenueSnapshot(): Promise<AdminRevenueDTO>;
  listUsersForAdmin(role?: string): Promise<AdminUserRowDTO[]>;
  getAdminLogs(): Promise<AdminLogsDTO>;
  getCenterOwner(
    centerId: string
  ): Promise<{ id: string; name: string; email: string; isVerified: boolean; status: "active" | "pending" | "disabled" } | null>;
  getTeachersCount(centerId: string): Promise<number>;
  getStudentsCount(centerId: string): Promise<number>;
}
