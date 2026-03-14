import { teacherApi } from "./teacher.api";
import {
  CreateTeacherPayload,
  UpdateTeacherPayload,
  UpdateTeacherStatusPayload,
} from "@/types/teacher/teacherTypes";

export const teacherService = {
  getTeachers: () => teacherApi.getTeachers(),
  getTeacherById: (id: string) => teacherApi.getTeacherById(id),
  createTeacher: (payload: CreateTeacherPayload) => teacherApi.createTeacher(payload),
  updateTeacher: (id: string, payload: UpdateTeacherPayload) => teacherApi.updateTeacher(id, payload),
  updateTeacherStatus: (id: string, payload: UpdateTeacherStatusPayload) =>
    teacherApi.updateTeacherStatus(id, payload),
  resetTeacherPassword: (id: string) => teacherApi.resetTeacherPassword(id),
  deleteTeacher: (id: string) => teacherApi.deleteTeacher(id),
};
