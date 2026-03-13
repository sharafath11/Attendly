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
  status: "Present" | "Absent";
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

export type ApiResponse<T> = {
  ok: boolean;
  msg: string;
  data: T;
};
