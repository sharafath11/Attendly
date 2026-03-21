import { FeeFiltersDTO, FeeRecordDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../../../dtos/fees/fees.dto";

export interface IFeesService {
  getFees(centerId: string, filters: FeeFiltersDTO): Promise<FeeRecordDTO[]>;
  markFeePaid(centerId: string, authUserId: string, payload: MarkFeePaidDTO): Promise<void>;
  updateFeeStatus(centerId: string, authUserId: string, payload: UpdateFeeStatusDTO): Promise<void>;
  getPendingFees(centerId: string, month?: number, year?: number): Promise<FeeRecordDTO[]>;
}
