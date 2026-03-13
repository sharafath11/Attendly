import {
  AttendanceByDateDTO,
  CreateAttendanceDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../../../dtos/attendance/attendance.dto";

export interface IAttendanceService {
  getStudentAttendanceSummary(userId: string, studentId: string): Promise<StudentAttendanceSummaryDTO>;
  getBatchAttendanceSummary(userId: string, batchId: string): Promise<BatchAttendanceSummaryDTO>;
  getLowAttendanceStudents(userId: string, batchId: string): Promise<LowAttendanceStudentDTO[]>;
  getAttendanceByBatchAndDate(
    userId: string,
    batchId: string,
    date: string
  ): Promise<AttendanceByDateDTO>;
  saveAttendance(userId: string, payload: CreateAttendanceDTO): Promise<void>;
}
