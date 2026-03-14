import {
  AttendanceRecordDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../../../dtos/attendance/attendance.dto";

export interface IAttendanceRepository {
  getStudentAttendanceSummary(centerId: string, studentId: string): Promise<StudentAttendanceSummaryDTO>;
  getBatchAttendanceSummary(centerId: string, batchId: string, dateFrom: Date): Promise<BatchAttendanceSummaryDTO>;
  getLowAttendanceStudents(
    centerId: string,
    batchId: string,
    dateFrom: Date,
    threshold: number
  ): Promise<LowAttendanceStudentDTO[]>;
  getAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: Date
  ): Promise<AttendanceRecordDTO[]>;
  upsertAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: Date,
    records: AttendanceRecordDTO[],
    markedBy: string
  ): Promise<void>;
  upsertAttendanceRecord(
    centerId: string,
    studentId: string,
    date: Date,
    status: AttendanceRecordDTO["status"],
    markedBy: string,
    batchId?: string
  ): Promise<void>;
  getAttendanceHistory(
    centerId: string,
    filters: {
      studentId?: string;
      batchId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<
    {
      id: string;
      studentId: string;
      batchId: string;
      date: string;
      status: "present" | "absent" | "leave";
      markedBy?: string;
      createdAt?: Date;
      updatedAt?: Date;
      student?: { id: string; name: string };
      batch?: { id: string; batchName: string };
      marker?: { id: string; name: string; role?: string };
    }[]
  >;
}
