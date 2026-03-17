export interface DashboardSummaryDTO {
  totalStudents: number;
  todayAttendance: number;
  pendingFees: number;
  pendingFeesAmount: number;
  totalBatches: number;
}

export interface DashboardAttendancePointDTO {
  day: string;
  present: number;
}

export interface DashboardFeePointDTO {
  month: string;
  amount: number;
}

export interface DashboardRecentAttendanceDTO {
  id: string;
  student: string;
  batch: string;
  status: "Present" | "Absent" | "Leave";
}

export interface DashboardRecentPaymentDTO {
  id: string;
  student: string;
  amount: number;
  date: string;
}

export interface DashboardUpcomingClassDTO {
  id: string;
  name: string;
  time: string;
}

export interface DashboardDTO {
  summary: DashboardSummaryDTO;
  attendanceChart: DashboardAttendancePointDTO[];
  attendanceMonthlyChart: DashboardAttendancePointDTO[];
  feeChart: DashboardFeePointDTO[];
  recentAttendance: DashboardRecentAttendanceDTO[];
  recentPayments: DashboardRecentPaymentDTO[];
  upcomingClasses: DashboardUpcomingClassDTO[];
}
