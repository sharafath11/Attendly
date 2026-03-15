import { getRequest, postRequest } from "./api";
import type {
  ApiResponse,
  AttendanceByDate,
  AttendanceHistoryFilters,
  AttendanceHistoryRecord,
  BatchAttendanceSummary,
  CreateAttendancePayload,
  LowAttendanceStudent,
  StudentAttendanceSummary,
} from "@/types/attendance/attendanceTypes";

export const attendanceApi = {
  getStudentSummary: (studentId: string) =>
    getRequest<ApiResponse<StudentAttendanceSummary>>(`/attendance/student/${studentId}/summary`),
  getBatchSummary: (batchId: string) =>
    getRequest<ApiResponse<BatchAttendanceSummary>>(`/attendance/batch/${batchId}/summary`),
  getLowAttendance: (batchId: string) =>
    getRequest<ApiResponse<LowAttendanceStudent[]>>(`/attendance/batch/${batchId}/low-attendance`),
  getAttendanceByDate: (batchId: string, date: string) =>
    getRequest<ApiResponse<AttendanceByDate>>("/attendance", { batchId, date }),
  getAttendanceHistory: (filters?: AttendanceHistoryFilters) =>
    getRequest<ApiResponse<AttendanceHistoryRecord[]>>("/attendance/history", filters),
  saveAttendance: (payload: CreateAttendancePayload) => postRequest<ApiResponse<any>>("/attendance", payload),
};
