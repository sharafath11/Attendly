import { IBatch, BatchDocument } from "../../../models/batches.model";
import { BatchFiltersDTO } from "../../../dtos/batches/batches.dto";
import { IBaseRepository } from "./IBaseRepository";

export interface IBatchesRepository extends IBaseRepository<BatchDocument, IBatch> {
  findBatchesByUser(centerId: string, filters: BatchFiltersDTO): Promise<IBatch[]>;
  findBatchByIdAndUser(id: string, centerId: string): Promise<IBatch | null>;
  updateBatchByIdAndUser(id: string, centerId: string, data: Partial<IBatch>): Promise<IBatch | null>;
  deleteBatchByIdAndUser(id: string, centerId: string): Promise<boolean>;
  getStudentCountsForBatches(centerId: string, batchIds: string[]): Promise<Map<string, number>>;
  getStudentCountForBatch(centerId: string, batchId: string): Promise<number>;
}
