import { batchesApi } from "./batches.api";
import { BatchFilters, CreateBatchPayload, UpdateBatchPayload } from "@/types/batches/batchTypes";

export const batchesService = {
  getBatches: (params?: BatchFilters) => batchesApi.getBatches(params),
  getBatchById: (id: string) => batchesApi.getBatchById(id),
  createBatch: (payload: CreateBatchPayload) => batchesApi.createBatch(payload),
  updateBatch: (id: string, payload: UpdateBatchPayload) => batchesApi.updateBatch(id, payload),
  deleteBatch: (id: string) => batchesApi.deleteBatch(id),
};
