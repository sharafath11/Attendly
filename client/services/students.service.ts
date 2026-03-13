import { studentsApi } from "./students.api";
import { CreateStudentPayload, StudentsQuery, UpdateStudentPayload } from "@/types/students/studentTypes";

export const studentsService = {
  getStudents: (params?: StudentsQuery) => studentsApi.getStudents(params),
  getStudentById: (id: string) => studentsApi.getStudentById(id),
  createStudent: (payload: CreateStudentPayload) => studentsApi.createStudent(payload),
  updateStudent: (id: string, payload: UpdateStudentPayload) => studentsApi.updateStudent(id, payload),
  deleteStudent: (id: string) => studentsApi.deleteStudent(id),
};
