import { deleteRequest, getRequest, postRequest, putRequest } from "./api";
import { ApiResponse, CreateStudentPayload, Student, StudentsListResponse, StudentsQuery, UpdateStudentPayload } from "@/types/students/studentTypes";

export const studentsApi = {
  getStudents: (params?: StudentsQuery) => getRequest<ApiResponse<StudentsListResponse>>("/students", params),
  getStudentById: (id: string) => getRequest<ApiResponse<Student>>(`/students/${id}`),
  createStudent: (payload: CreateStudentPayload) => postRequest<ApiResponse<Student>>("/students", payload),
  updateStudent: (id: string, payload: UpdateStudentPayload) => putRequest(`/students/${id}`, payload),
  deleteStudent: (id: string) => deleteRequest(`/students/${id}`),
};
