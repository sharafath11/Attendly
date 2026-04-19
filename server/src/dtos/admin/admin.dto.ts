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

/** Extended platform metrics for super_admin analytics (MRR = monthlyRevenue). */
export interface AdminPlatformMetricsDTO extends AdminDashboardDTO {
  totalParents: number;
  totalCenterOwners: number;
  whatsappSent30d: number;
  whatsappFailed30d: number;
  feeRemindersSent30d: number;
  attendanceMarks30d: number;
  platformPaymentsCollectedInr: number;
  dailyActiveUsersApprox: number;
  topCentersByPlatformPayments: Array<{ centerId: string; centerName: string; totalInr: number }>;
  /** Active centers with no activity log in the last 7 days */
  inactiveCenters7d: number;
  /** Pending/expired subscriptions + inactive active centers (approx.) */
  atRiskCentersApprox: number;
  /** WhatsApp/email failures in last 24h (system health) */
  notificationFailures24h: number;
}

export interface AdminRevenueDTO {
  monthlyRecurringRevenue: number;
  platformPaymentsCollectedInr: number;
  activeSubscriptionCenters: number;
  pendingPaymentCenters: number;
  expiredCenters: number;
  blockedCentersCount: number;
}

export interface AdminUserRowDTO {
  id: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  centerId?: string | null;
  status: string;
  createdAt: string;
}

export interface AdminLogsDTO {
  activities: Array<{
    id: string;
    centerId: string;
    action: string;
    summary: string;
    createdAt: string;
  }>;
  whatsappFailures: Array<{
    id: string;
    centerId: string;
    type: string;
    error?: string;
    createdAt: string;
  }>;
}
