import {
  BatchFiltersDTO,
  BatchResponseDTO,
  BatchesListResponseDTO,
  CreateBatchDTO,
  UpdateBatchDTO,
} from "../../../dtos/batches/batches.dto";

export interface IBatchesService {
  createBatch(centerId: string, payload: CreateBatchDTO): Promise<BatchResponseDTO>;
  getBatches(centerId: string, filters: BatchFiltersDTO): Promise<BatchesListResponseDTO>;
  getBatchById(centerId: string, id: string): Promise<BatchResponseDTO>;
  updateBatch(centerId: string, id: string, payload: UpdateBatchDTO): Promise<BatchResponseDTO>;
  deleteBatch(centerId: string, id: string): Promise<void>;
}
