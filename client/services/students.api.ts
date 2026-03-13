import { deleteRequest, getRequest, postRequest, putRequest } from "./api";
import { CreateStudentPayload, StudentsQuery, UpdateStudentPayload } from "@/types/students/studentTypes";

export const studentsApi = {
  getStudents: (params?: StudentsQuery) => getRequest("/students", params),
  getStudentById: (id: string) => getRequest(`/students/${id}`),
  createStudent: (payload: CreateStudentPayload) => postRequest("/students", payload),
  updateStudent: (id: string, payload: UpdateStudentPayload) => putRequest(`/students/${id}`, payload),
  deleteStudent: (id: string) => deleteRequest(`/students/${id}`),
};
