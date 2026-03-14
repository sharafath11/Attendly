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

export type AdminCharts = {
  revenueByMonth: { month: string; revenue: number }[];
  centersGrowth: { month: string; centers: number }[];
};

export type CenterOwner = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
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
