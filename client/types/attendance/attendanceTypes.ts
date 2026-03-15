export type AttendanceTrendPoint = {
  label: string;
  present: number;
  absent: number;
  attendancePercentage: number;
};

export type StudentAttendanceSummary = {
  studentId: string;
  totalClasses: number;
  present: number;
  absent: number;
  attendancePercentage: number;
};

export type BatchAttendanceSummary = {
  batchId: string;
  totalStudents: number;
  averageAttendance: number;
  totalPresent: number;
  totalAbsent: number;
  dateRange: string;
  dailyTrend: AttendanceTrendPoint[];
  monthlyTrend: AttendanceTrendPoint[];
};

export type LowAttendanceStudent = {
  studentId: string;
  studentName: string;
  attendancePercentage: number;
};

export type AttendanceRecord = {
  studentId: string;
  status: "present" | "absent" | "leave";
};

export type AttendanceByDate = {
  batchId: string;
  date: string;
  records: AttendanceRecord[];
};

export type CreateAttendancePayload = {
  batchId: string;
  date: string;
  records: AttendanceRecord[];
};

export type AttendanceHistoryRecord = {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  status: "present" | "absent" | "leave";
  markedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    batchName: string;
  };
  marker?: {
    id: string;
    name: string;
    role?: string;
  };
};

export type AttendanceHistoryFilters = {
  studentId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
