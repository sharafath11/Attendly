import { SubscriptionStatus } from "../../models/center.model";

export interface BlockCenterDTO {
  blockedReason?: string;
  reason?: string;
}

export interface UpdatePaymentStatusDTO {
  subscriptionStatus: SubscriptionStatus;
  lastPaymentDate?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface UpdateUserStatusDTO {
  status: "active" | "pending" | "disabled";
}

export interface AdminDashboardDTO {
  totalCenters: number;
  activeCenters: number;
  blockedCenters: number;
  pendingCenters: number;
  totalStudents: number;
  totalTeachers: number;
  monthlyRevenue: number;
}

export interface AdminDashboardChartsDTO {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  centersGrowth: Array<{ month: string; centers: number }>;
}
