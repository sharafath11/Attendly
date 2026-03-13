import { deleteRequest, getRequest, postRequest, putRequest } from "./api";
import { BatchFilters, CreateBatchPayload, UpdateBatchPayload } from "@/types/batches/batchTypes";

export const batchesApi = {
  getBatches: (params?: BatchFilters) => getRequest("/batches", params),
  getBatchById: (id: string) => getRequest(`/batches/${id}`),
  createBatch: (payload: CreateBatchPayload) => postRequest("/batches", payload),
  updateBatch: (id: string, payload: UpdateBatchPayload) => putRequest(`/batches/${id}`, payload),
  deleteBatch: (id: string) => deleteRequest(`/batches/${id}`),
};
