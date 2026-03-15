import { deleteRequest, getRequest, postRequest, putRequest } from "./api";
import { ApiResponse, Batch, BatchesListResponse, BatchFilters, CreateBatchPayload, UpdateBatchPayload } from "@/types/batches/batchTypes";

export const batchesApi = {
  getBatches: (params?: BatchFilters) => getRequest<ApiResponse<BatchesListResponse>>("/batches", params),
  getBatchById: (id: string) => getRequest<ApiResponse<Batch>>(`/batches/${id}`),
  createBatch: (payload: CreateBatchPayload) => postRequest<ApiResponse<Batch>>("/batches", payload),
  updateBatch: (id: string, payload: UpdateBatchPayload) => putRequest(`/batches/${id}`, payload),
  deleteBatch: (id: string) => deleteRequest(`/batches/${id}`),
};
