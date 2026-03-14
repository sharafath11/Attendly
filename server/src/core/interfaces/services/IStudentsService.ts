import { CreateStudentDTO, StudentsListResponseDTO, UpdateStudentDTO } from "../../../dtos/students/students.dto";
import { StudentResponseDTO } from "../../../dtos/students/students.dto";
import { StudentQueryDTO } from "../../../dtos/students/students.dto";

export interface IStudentsService {
  createStudent(centerId: string, payload: CreateStudentDTO): Promise<StudentResponseDTO>;
  getStudents(centerId: string, query: StudentQueryDTO): Promise<StudentsListResponseDTO>;
  getStudentById(centerId: string, id: string): Promise<StudentResponseDTO>;
  updateStudent(centerId: string, id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO>;
  deleteStudent(centerId: string, id: string): Promise<void>;
}
