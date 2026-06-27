import { CreateStudentDTO, PaginatedStudentsResponseDTO, UpdateStudentDTO } from "../../../dtos/students/students.dto";
import { StudentResponseDTO } from "../../../dtos/students/students.dto";
import { StudentQueryDTO } from "../../../dtos/students/students.dto";

export interface IStudentsService {
  createStudent(centerId: string, payload: CreateStudentDTO, actorUserId?: string): Promise<StudentResponseDTO>;
  getStudents(centerId: string, query: StudentQueryDTO): Promise<PaginatedStudentsResponseDTO>;
  getStudentById(centerId: string, id: string): Promise<StudentResponseDTO>;
  updateStudent(centerId: string, id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO>;
  deleteStudent(centerId: string, id: string, actorUserId?: string): Promise<void>;
}
