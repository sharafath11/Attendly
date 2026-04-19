export interface DashboardSummaryDTO {
  totalStudents: number;
  todayAttendance: number;
  pendingFees: number;
  pendingFeesAmount: number;
  totalBatches: number;
}

export interface DashboardInsightsDTO {
  /** Fee reminder notifications sent (last 30 days) */
  remindersSent30d: number;
  /** Sum of paid fee amounts current calendar month */
  feesCollectedMonthInr: number;
  /** % present among marked sessions last 30 days */
  attendanceRateLast30d: number;
  /** Distinct students with at least one pending/overdue fee row */
  unpaidStudentsCount: number;
  /** True when batches run today (IST) but not all students have an attendance row yet */
  attendanceNotFullyMarkedToday: boolean;
  /** Ready-to-show lines for the owner dashboard */
  insightLines: string[];
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
  insights: DashboardInsightsDTO;
  attendanceChart: DashboardAttendancePointDTO[];
  attendanceMonthlyChart: DashboardAttendancePointDTO[];
  feeChart: DashboardFeePointDTO[];
  recentAttendance: DashboardRecentAttendanceDTO[];
  recentPayments: DashboardRecentPaymentDTO[];
  upcomingClasses: DashboardUpcomingClassDTO[];
}
