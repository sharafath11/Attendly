export type DashboardSummary = {
  totalStudents: number;
  todayAttendance: number;
  pendingFees: number;
  pendingFeesAmount: number;
  totalBatches: number;
};

export type DashboardAttendancePoint = {
  day: string;
  present: number;
};

export type DashboardFeePoint = {
  month: string;
  amount: number;
};

export type DashboardRecentAttendance = {
  id: string;
  student: string;
  batch: string;
  status: "Present" | "Absent" | "Leave";
};

export type DashboardRecentPayment = {
  id: string;
  student: string;
  amount: number;
  date: string;
};

export type DashboardUpcomingClass = {
  id: string;
  name: string;
  time: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  attendanceChart: DashboardAttendancePoint[];
  attendanceMonthlyChart: DashboardAttendancePoint[];
  feeChart: DashboardFeePoint[];
  recentAttendance: DashboardRecentAttendance[];
  recentPayments: DashboardRecentPayment[];
  upcomingClasses: DashboardUpcomingClass[];
};

export type ApiResponse<T> = {
  ok: boolean;
  msg?: string;
  data?: T;
};
