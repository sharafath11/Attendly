export type SubscriptionStatus = "active" | "pending_payment" | "expired" | "blocked";

export type AdminDashboard = {
  totalCenters: number;
  activeCenters: number;
  blockedCenters: number;
  pendingCenters: number;
  totalStudents: number;
  totalTeachers: number;
  monthlyRevenue: number;
};

export type AdminPlatformMetrics = AdminDashboard & {
  totalParents: number;
  totalCenterOwners: number;
  whatsappSent30d: number;
  whatsappFailed30d: number;
  feeRemindersSent30d: number;
  attendanceMarks30d: number;
  platformPaymentsCollectedInr: number;
  dailyActiveUsersApprox: number;
  topCentersByPlatformPayments: { centerId: string; centerName: string; totalInr: number }[];
  inactiveCenters7d: number;
  atRiskCentersApprox: number;
  notificationFailures24h: number;
};

export type AdminRevenue = {
  monthlyRecurringRevenue: number;
  platformPaymentsCollectedInr: number;
  activeSubscriptionCenters: number;
  pendingPaymentCenters: number;
  expiredCenters: number;
  blockedCentersCount: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  centerId?: string | null;
  status: string;
  createdAt: string;
};

export type AdminLogs = {
  activities: { id: string; centerId: string; action: string; summary: string; createdAt: string }[];
  whatsappFailures: { id: string; centerId: string; type: string; error?: string; createdAt: string }[];
};

export type AdminCharts = {
  revenueByMonth: { month: string; revenue: number }[];
  centersGrowth: { month: string; centers: number }[];
};

export type CenterOwner = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  status: "active" | "pending" | "disabled";
};

export type AdminCenter = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  medium?: "English" | "Malayalam";
  status?: string;
  planType?: "basic" | "pro";
  teacherLimit?: number;
  studentLimit?: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  blocked: boolean;
  blockedReason?: string | null;
  blockedAt?: string | null;
  planName?: string | null;
  monthlyFee?: number | null;
  lastPaymentDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: CenterOwner;
};

export type AdminCenterDetail = AdminCenter & {
  totalStudents: number;
  totalTeachers: number;
};

export type BlockCenterPayload = {
  blockedReason: string;
};

export type UpdatePaymentStatusPayload = {
  subscriptionStatus: SubscriptionStatus;
  lastPaymentDate?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
};

export type UpdateUserStatusPayload = {
  status: "active" | "pending" | "disabled";
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
