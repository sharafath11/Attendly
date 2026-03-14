import { teacherAttendanceApi } from "./teacherAttendance.api";
import type {
  CreateTeacherAttendancePayload,
  TeacherAttendanceFilters,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

export const teacherAttendanceService = {
  getAttendance: (filters?: TeacherAttendanceFilters) => teacherAttendanceApi.getAttendance(filters),
  saveAttendance: (payload: CreateTeacherAttendancePayload) => teacherAttendanceApi.saveAttendance(payload),
};
