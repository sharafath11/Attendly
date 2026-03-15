import { getRequest, postRequest } from "./api";
import type {
  ApiResponse,
  CreateTeacherAttendancePayload,
  TeacherAttendance,
  TeacherAttendanceFilters,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

export const teacherAttendanceApi = {
  getAttendance: (params?: TeacherAttendanceFilters) =>
    getRequest<ApiResponse<TeacherAttendance[]>>("/teacher-attendance", params),
  saveAttendance: (payload: CreateTeacherAttendancePayload) =>
    postRequest<ApiResponse<any>>("/teacher-attendance", payload),
};
