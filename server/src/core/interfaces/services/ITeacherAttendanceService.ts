import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
  TeacherAttendanceRecordDTO,
} from "../../../dtos/teacherAttendance/teacherAttendance.dto";

export interface ITeacherAttendanceService {
  saveAttendance(authUserId: string, payload: CreateTeacherAttendanceDTO): Promise<TeacherAttendanceRecordDTO>;
  getAttendance(authUserId: string, filters: TeacherAttendanceFiltersDTO): Promise<TeacherAttendanceRecordDTO[]>;
}
