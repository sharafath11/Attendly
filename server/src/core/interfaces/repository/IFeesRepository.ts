import { FeeFiltersDTO, FeeRecordDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../../../dtos/fees/fees.dto";

export interface IFeesRepository {
  ensureFeesForMonth(userId: string, filters: FeeFiltersDTO): Promise<void>;
  getFees(userId: string, filters: FeeFiltersDTO): Promise<FeeRecordDTO[]>;
  markFeePaid(userId: string, payload: MarkFeePaidDTO): Promise<void>;
  updateFeeStatus(userId: string, payload: UpdateFeeStatusDTO): Promise<void>;
  getPendingFees(userId: string, month?: number, year?: number): Promise<FeeRecordDTO[]>;
}
