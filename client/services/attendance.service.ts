import { attendanceApi } from "./attendance.api";

export const attendanceService = {
  getStudentSummary: (studentId: string) => attendanceApi.getStudentSummary(studentId),
  getBatchSummary: (batchId: string) => attendanceApi.getBatchSummary(batchId),
  getLowAttendance: (batchId: string) => attendanceApi.getLowAttendance(batchId),
  getAttendanceByDate: (batchId: string, date: string) =>
    attendanceApi.getAttendanceByDate(batchId, date),
  saveAttendance: (payload: CreateAttendancePayload) => attendanceApi.saveAttendance(payload),
};
import type { CreateAttendancePayload } from "@/types/attendance/attendanceTypes";
