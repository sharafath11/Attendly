import { inject, injectable } from "tsyringe";
import { IFeesService } from "../core/interfaces/services/IFeesService";
import { IFeesRepository } from "../core/interfaces/repository/IFeesRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { ITeacherRepository } from "../core/interfaces/repository/ITeacherRepository";
import { TYPES } from "../core/types";
import { FeeFiltersDTO, FeeRecordDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../dtos/fees/fees.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

@injectable()
export class FeesService implements IFeesService {
  constructor(
    @inject(TYPES.IFeesRepository)
    private _feesRepository: IFeesRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository,
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository
  ) {}

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

  async getFees(centerId: string, filters: FeeFiltersDTO): Promise<FeeRecordDTO[]> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Fee reports disabled.");
    await this._feesRepository.ensureFeesForMonth(centerId, filters);
    return this._feesRepository.getFees(centerId, filters);
  }

  private async ensureMarkerInCenter(centerId: string, markerUserId: string): Promise<void> {
    const marker = await this._teacherRepository.findById(markerUserId);
    if (!marker) {
      throwError("Selected user not found", StatusCode.NOT_FOUND);
    }

    const markerCenterId = marker.centerId ? marker.centerId.toString() : marker._id.toString();
    const markerRole = marker.role ?? "center_owner";
    if (markerCenterId !== centerId || !["center_owner", "teacher"].includes(markerRole)) {
      throwError("Selected user does not belong to this center", StatusCode.BAD_REQUEST);
    }
  }

  async markFeePaid(centerId: string, authUserId: string, payload: MarkFeePaidDTO): Promise<void> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Fee collection disabled.");
    const markedByUserId = payload.markedByUserId ?? authUserId;
    await this.ensureMarkerInCenter(centerId, markedByUserId);
    await this._feesRepository.markFeePaid(centerId, authUserId, {
      ...payload,
      markedByUserId,
    });
  }

  async updateFeeStatus(centerId: string, authUserId: string, payload: UpdateFeeStatusDTO): Promise<void> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Fee updates disabled.");
    await this._feesRepository.updateFeeStatus(centerId, authUserId, payload);
  }

  async getPendingFees(centerId: string, month?: number, year?: number): Promise<FeeRecordDTO[]> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Fee reports disabled.");
    return this._feesRepository.getPendingFees(centerId, month, year);
  }
}
