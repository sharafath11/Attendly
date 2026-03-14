import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
  TeacherAttendanceRecordDTO,
} from "../../../dtos/teacherAttendance/teacherAttendance.dto";

export interface ITeacherAttendanceRepository {
  upsertAttendance(centerId: string, payload: CreateTeacherAttendanceDTO): Promise<TeacherAttendanceRecordDTO>;
  getAttendance(centerId: string, filters: TeacherAttendanceFiltersDTO): Promise<TeacherAttendanceRecordDTO[]>;
}
