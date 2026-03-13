import { inject, injectable } from "tsyringe";
import { IFeesService } from "../core/interfaces/services/IFeesService";
import { IFeesRepository } from "../core/interfaces/repository/IFeesRepository";
import { TYPES } from "../core/types";
import { FeeFiltersDTO, FeeRecordDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../dtos/fees/fees.dto";

@injectable()
export class FeesService implements IFeesService {
  constructor(
    @inject(TYPES.IFeesRepository)
    private _feesRepository: IFeesRepository
  ) {}

  async getFees(userId: string, filters: FeeFiltersDTO): Promise<FeeRecordDTO[]> {
    await this._feesRepository.ensureFeesForMonth(userId, filters);
    return this._feesRepository.getFees(userId, filters);
  }

  async markFeePaid(userId: string, payload: MarkFeePaidDTO): Promise<void> {
    await this._feesRepository.markFeePaid(userId, payload);
  }

  async updateFeeStatus(userId: string, payload: UpdateFeeStatusDTO): Promise<void> {
    await this._feesRepository.updateFeeStatus(userId, payload);
  }

  async getPendingFees(userId: string, month?: number, year?: number): Promise<FeeRecordDTO[]> {
    return this._feesRepository.getPendingFees(userId, month, year);
  }
}
