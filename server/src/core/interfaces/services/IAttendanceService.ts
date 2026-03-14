import {
  AttendanceByDateDTO,
  CreateAttendanceDTO,
  BatchAttendanceSummaryDTO,
  LowAttendanceStudentDTO,
  StudentAttendanceSummaryDTO,
} from "../../../dtos/attendance/attendance.dto";

export interface IAttendanceService {
  getStudentAttendanceSummary(centerId: string, studentId: string): Promise<StudentAttendanceSummaryDTO>;
  getBatchAttendanceSummary(centerId: string, batchId: string): Promise<BatchAttendanceSummaryDTO>;
  getLowAttendanceStudents(centerId: string, batchId: string): Promise<LowAttendanceStudentDTO[]>;
  getAttendanceByBatchAndDate(
    centerId: string,
    batchId: string,
    date: string
  ): Promise<AttendanceByDateDTO>;
  saveAttendance(centerId: string, markedBy: string, payload: CreateAttendanceDTO): Promise<void>;
  getAttendanceHistory(
    centerId: string,
    filters: {
      studentId?: string;
      batchId?: string;
      dateFrom?: string;
      dateTo?: string;
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
