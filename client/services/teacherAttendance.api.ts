import { getRequest, postRequest } from "./api";
import type {
  CreateTeacherAttendancePayload,
  TeacherAttendanceFilters,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

export const teacherAttendanceApi = {
  getAttendance: (params?: TeacherAttendanceFilters) => getRequest("/teacher-attendance", params),
  saveAttendance: (payload: CreateTeacherAttendancePayload) => postRequest("/teacher-attendance", payload),
};
