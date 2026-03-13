import { getRequest, postRequest } from "./api";
import type { CreateAttendancePayload } from "@/types/attendance/attendanceTypes";

export const attendanceApi = {
  getStudentSummary: (studentId: string) => getRequest(`/attendance/student/${studentId}/summary`),
  getBatchSummary: (batchId: string) => getRequest(`/attendance/batch/${batchId}/summary`),
  getLowAttendance: (batchId: string) => getRequest(`/attendance/batch/${batchId}/low-attendance`),
  getAttendanceByDate: (batchId: string, date: string) =>
    getRequest("/attendance", { batchId, date }),
  saveAttendance: (payload: CreateAttendancePayload) => postRequest("/attendance", payload),
};
