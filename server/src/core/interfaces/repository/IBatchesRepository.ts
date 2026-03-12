import { IBatch, BatchDocument } from "../../../models/batches.model";
import { BatchFiltersDTO } from "../../../dtos/batches/batches.dto";
import { IBaseRepository } from "./IBaseRepository";

export interface IBatchesRepository extends IBaseRepository<BatchDocument, IBatch> {
  findBatchesByUser(userId: string, filters: BatchFiltersDTO): Promise<IBatch[]>;
  findBatchByIdAndUser(id: string, userId: string): Promise<IBatch | null>;
  updateBatchByIdAndUser(id: string, userId: string, data: Partial<IBatch>): Promise<IBatch | null>;
  deleteBatchByIdAndUser(id: string, userId: string): Promise<boolean>;
  getStudentCountsForBatches(userId: string, batchIds: string[]): Promise<Map<string, number>>;
  getStudentCountForBatch(userId: string, batchId: string): Promise<number>;
}
