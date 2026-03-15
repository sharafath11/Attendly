import { getRequest, patchRequest, postRequest } from "./api";
import type { ApiResponse, FeeFilters, FeeRecord, MarkFeePaidPayload, UpdateFeeStatusPayload } from "@/types/fees/feesTypes";

export const feesApi = {
  getFees: (params: FeeFilters) => getRequest<ApiResponse<FeeRecord[]>>("/fees", params),
  getPendingFees: (params?: { month?: number; year?: number }) =>
    getRequest<ApiResponse<FeeRecord[]>>("/fees/pending", params),
  markPaid: (payload: MarkFeePaidPayload) => postRequest<ApiResponse<any>>("/fees/mark-paid", payload),
  updateStatus: (payload: UpdateFeeStatusPayload) => patchRequest<ApiResponse<any>>("/fees/update-status", payload),
};
