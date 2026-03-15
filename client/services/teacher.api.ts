import { deleteRequest, getRequest, patchRequest, postRequest } from "./api";
import {
  ApiResponse,
  CreateTeacherPayload,
  CreateTeacherResponse,
  Teacher,
  UpdateTeacherPayload,
  UpdateTeacherStatusPayload,
} from "@/types/teacher/teacherTypes";

export const teacherApi = {
  getTeachers: () => getRequest<ApiResponse<Teacher[]>>("/teachers"),
  getTeacherById: (id: string) => getRequest<ApiResponse<Teacher>>(`/teachers/${id}`),
  createTeacher: (payload: CreateTeacherPayload) =>
    postRequest<ApiResponse<CreateTeacherResponse>>("/teachers", payload),
  updateTeacher: (id: string, payload: UpdateTeacherPayload) =>
    patchRequest<ApiResponse<Teacher>>(`/teachers/${id}`, payload),
  updateTeacherStatus: (id: string, payload: UpdateTeacherStatusPayload) =>
    patchRequest<ApiResponse<any>>(`/teachers/${id}/status`, payload),
  resetTeacherPassword: (id: string) => postRequest<ApiResponse<any>>(`/teachers/${id}/reset-password`, {}),
  deleteTeacher: (id: string) => deleteRequest<ApiResponse<any>>(`/teachers/${id}`),
};
