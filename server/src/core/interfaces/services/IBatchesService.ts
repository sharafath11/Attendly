import {
  BatchFiltersDTO,
  BatchResponseDTO,
  BatchesListResponseDTO,
  CreateBatchDTO,
  UpdateBatchDTO,
} from "../../../dtos/batches/batches.dto";

export interface IBatchesService {
  createBatch(userId: string, payload: CreateBatchDTO): Promise<BatchResponseDTO>;
  getBatches(userId: string, filters: BatchFiltersDTO): Promise<BatchesListResponseDTO>;
  getBatchById(userId: string, id: string): Promise<BatchResponseDTO>;
  updateBatch(userId: string, id: string, payload: UpdateBatchDTO): Promise<BatchResponseDTO>;
  deleteBatch(userId: string, id: string): Promise<void>;
}
