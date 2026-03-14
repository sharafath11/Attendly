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
  status: "present" | "absent" | "leave";
}

export interface AttendanceByDateDTO {
  batchId: string;
  date: string;
  records: AttendanceRecordDTO[];
}

export interface CreateAttendanceDTO {
  batchId?: string;
  date: string | Date;
  records?: AttendanceRecordDTO[];
  studentId?: string;
  status?: "present" | "absent" | "leave";
}

export interface AttendanceHistoryFiltersDTO {
  studentId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceHistoryRecordDTO {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  status: "present" | "absent" | "leave";
  markedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
}
