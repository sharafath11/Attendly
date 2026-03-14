import { inject, injectable } from "tsyringe";
import { ITeacherPaymentsService } from "../core/interfaces/services/ITeacherPaymentsService";
import { ITeacherPaymentsRepository } from "../core/interfaces/repository/ITeacherPaymentsRepository";
import { ITeacherRepository } from "../core/interfaces/repository/ITeacherRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import {
  CreateTeacherPaymentDTO,
  TeacherPaymentFiltersDTO,
  TeacherPaymentRecordDTO,
} from "../dtos/teacherPayments/teacherPayments.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";

@injectable()
export class TeacherPaymentsService implements ITeacherPaymentsService {
  constructor(
    @inject(TYPES.ITeacherPaymentsRepository)
    private _teacherPaymentsRepository: ITeacherPaymentsRepository,
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
  ) {}

  private async getOwnerAndCenter(authUserId: string) {
    const owner = await this._teacherRepository.findById(authUserId);
    if (!owner) {
      throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
    }
    const role = owner.role ?? "center_owner";
    if (role !== "center_owner") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
    return {
      owner,
      centerId: owner.centerId ? owner.centerId.toString() : owner._id.toString(),
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

  async createPayment(authUserId: string, payload: CreateTeacherPaymentDTO): Promise<TeacherPaymentRecordDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher payments disabled.");
    await this.ensureTeacherInCenter(centerId, payload.teacherId);
    return this._teacherPaymentsRepository.createPayment(centerId, payload);
  }

  async getPayments(
    authUserId: string,
    filters: TeacherPaymentFiltersDTO
  ): Promise<TeacherPaymentRecordDTO[]> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher payments disabled.");
    if (filters.teacherId) {
      await this.ensureTeacherInCenter(centerId, filters.teacherId);
    }
    return this._teacherPaymentsRepository.getPayments(centerId, filters);
  }
}
