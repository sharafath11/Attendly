import { CreateStudentDTO, StudentsListResponseDTO, UpdateStudentDTO } from "../../../modules/students/students.dto";
import { StudentResponseDTO } from "../../../modules/students/students.dto";
import { StudentQueryDTO } from "../../../modules/students/students.dto";

export interface IStudentsService {
  createStudent(userId: string, payload: CreateStudentDTO): Promise<StudentResponseDTO>;
  getStudents(userId: string, query: StudentQueryDTO): Promise<StudentsListResponseDTO>;
  getStudentById(userId: string, id: string): Promise<StudentResponseDTO>;
  updateStudent(userId: string, id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO>;
  deleteStudent(userId: string, id: string): Promise<void>;
}
