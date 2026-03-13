export interface StudentAttendanceSummaryDTO {
  studentId: string;
  totalClasses: number;
  present: number;
  absent: number;
  attendancePercentage: number;
}

export interface AttendanceTrendPointDTO {
  label: string;
  present: number;
  absent: number;
  attendancePercentage: number;
}

export interface BatchAttendanceSummaryDTO {
  batchId: string;
  totalStudents: number;
  averageAttendance: number;
  totalPresent: number;
  totalAbsent: number;
  dateRange: string;
  dailyTrend: AttendanceTrendPointDTO[];
  monthlyTrend: AttendanceTrendPointDTO[];
}

export interface LowAttendanceStudentDTO {
  studentId: string;
  studentName: string;
  attendancePercentage: number;
}

export interface AttendanceRecordDTO {
  studentId: string;
  status: "Present" | "Absent";
}

export interface AttendanceByDateDTO {
  batchId: string;
  date: string;
  records: AttendanceRecordDTO[];
}

export interface CreateAttendanceDTO {
  batchId: string;
  date: string | Date;
  records: AttendanceRecordDTO[];
}
