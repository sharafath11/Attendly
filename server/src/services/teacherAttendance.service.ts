import { inject, injectable } from "tsyringe";
import { ITeacherAttendanceService } from "../core/interfaces/services/ITeacherAttendanceService";
import { ITeacherAttendanceRepository } from "../core/interfaces/repository/ITeacherAttendanceRepository";
import { ITeacherRepository } from "../core/interfaces/repository/ITeacherRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
  TeacherAttendanceRecordDTO,
} from "../dtos/teacherAttendance/teacherAttendance.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";

@injectable()
export class TeacherAttendanceService implements ITeacherAttendanceService {
  constructor(
    @inject(TYPES.ITeacherAttendanceRepository)
    private _teacherAttendanceRepository: ITeacherAttendanceRepository,
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
  ) {}

  private async getUserAndCenter(authUserId: string) {
    const user = await this._teacherRepository.findById(authUserId);
    if (!user) {
      throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
    }
    const role = user.role ?? "center_owner";
    if (role !== "center_owner" && role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
    return {
      user,
      centerId: user.centerId ? user.centerId.toString() : user._id.toString(),
      role,
    };
  }

  private async ensureActiveSubscription(centerId: string, message: string): Promise<void> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    if (center.blocked) {
      throwError("Your center account has been blocked.", StatusCode.FORBIDDEN);
    }
    if (center.subscriptionStatus !== "active") {
      throwError(message, StatusCode.FORBIDDEN);
    }
  }

  private async ensureTeacherInCenter(centerId: string, teacherId: string): Promise<void> {
    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
  }

  async saveAttendance(
    authUserId: string,
    payload: CreateTeacherAttendanceDTO
  ): Promise<TeacherAttendanceRecordDTO> {
    const { centerId } = await this.getUserAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher attendance disabled.");
    await this.ensureTeacherInCenter(centerId, payload.teacherId);
    return this._teacherAttendanceRepository.upsertAttendance(centerId, payload);
  }

  async getAttendance(
    authUserId: string,
    filters: TeacherAttendanceFiltersDTO
  ): Promise<TeacherAttendanceRecordDTO[]> {
    const { centerId } = await this.getUserAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher attendance disabled.");
    if (filters.teacherId) {
      await this.ensureTeacherInCenter(centerId, filters.teacherId);
    }
    return this._teacherAttendanceRepository.getAttendance(centerId, filters);
  }
}
