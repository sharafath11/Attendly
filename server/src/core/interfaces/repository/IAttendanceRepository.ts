import {
  AttendanceRecordDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../../../dtos/attendance/attendance.dto";

export interface IAttendanceRepository {
  getStudentAttendanceSummary(userId: string, studentId: string): Promise<StudentAttendanceSummaryDTO>;
  getBatchAttendanceSummary(userId: string, batchId: string, dateFrom: Date): Promise<BatchAttendanceSummaryDTO>;
  getLowAttendanceStudents(
    userId: string,
    batchId: string,
    dateFrom: Date,
    threshold: number
  ): Promise<LowAttendanceStudentDTO[]>;
  getAttendanceByBatchAndDate(
    userId: string,
    batchId: string,
    date: Date
  ): Promise<AttendanceRecordDTO[]>;
  upsertAttendanceByBatchAndDate(
    userId: string,
    batchId: string,
    date: Date,
    records: AttendanceRecordDTO[]
  ): Promise<void>;
}
