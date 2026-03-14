import { attendanceApi } from "./attendance.api";
import type { AttendanceHistoryFilters, CreateAttendancePayload } from "@/types/attendance/attendanceTypes";

export const attendanceService = {
  getStudentSummary: (studentId: string) => attendanceApi.getStudentSummary(studentId),
  getBatchSummary: (batchId: string) => attendanceApi.getBatchSummary(batchId),
  getLowAttendance: (batchId: string) => attendanceApi.getLowAttendance(batchId),
  getAttendanceByDate: (batchId: string, date: string) =>
    attendanceApi.getAttendanceByDate(batchId, date),
  getAttendanceHistory: (filters?: AttendanceHistoryFilters) =>
    attendanceApi.getAttendanceHistory(filters),
  saveAttendance: (payload: CreateAttendancePayload) => attendanceApi.saveAttendance(payload),
};
