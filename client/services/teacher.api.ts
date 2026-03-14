import { deleteRequest, getRequest, patchRequest, postRequest } from "./api";
import {
  CreateTeacherPayload,
  UpdateTeacherPayload,
  UpdateTeacherStatusPayload,
} from "@/types/teacher/teacherTypes";

export const teacherApi = {
  getTeachers: () => getRequest("/teachers"),
  getTeacherById: (id: string) => getRequest(`/teachers/${id}`),
  createTeacher: (payload: CreateTeacherPayload) => postRequest("/teachers", payload),
  updateTeacher: (id: string, payload: UpdateTeacherPayload) => patchRequest(`/teachers/${id}`, payload),
  updateTeacherStatus: (id: string, payload: UpdateTeacherStatusPayload) =>
    patchRequest(`/teachers/${id}/status`, payload),
  resetTeacherPassword: (id: string) => postRequest(`/teachers/${id}/reset-password`, {}),
  deleteTeacher: (id: string) => deleteRequest(`/teachers/${id}`),
};
