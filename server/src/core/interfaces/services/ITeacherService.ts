import {
  CreateTeacherDTO,
  CreateTeacherResponseDTO,
  TeacherResponseDTO,
  UpdateTeacherDTO,
  UpdateTeacherStatusDTO,
} from "../../../dtos/teacher/teacher.dto";

export interface ITeacherService {
  createTeacher(authUserId: string, payload: CreateTeacherDTO): Promise<CreateTeacherResponseDTO>;
  getTeachers(authUserId: string): Promise<TeacherResponseDTO[]>;
  getTeacherById(authUserId: string, teacherId: string): Promise<TeacherResponseDTO>;
  updateTeacherStatus(
    authUserId: string,
    teacherId: string,
    payload: UpdateTeacherStatusDTO
  ): Promise<TeacherResponseDTO>;
  updateTeacher(
    authUserId: string,
    teacherId: string,
    payload: UpdateTeacherDTO
  ): Promise<TeacherResponseDTO>;
  resetTeacherPassword(authUserId: string, teacherId: string): Promise<CreateTeacherResponseDTO>;
  deleteTeacher(authUserId: string, teacherId: string): Promise<void>;
}
