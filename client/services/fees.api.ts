import { getRequest, patchRequest, postRequest } from "./api";
import type { FeeFilters, MarkFeePaidPayload, UpdateFeeStatusPayload } from "@/types/fees/feesTypes";

export const feesApi = {
  getFees: (params: FeeFilters) => getRequest("/fees", params),
  getPendingFees: (params?: { month?: number; year?: number }) => getRequest("/fees/pending", params),
  markPaid: (payload: MarkFeePaidPayload) => postRequest("/fees/mark-paid", payload),
  updateStatus: (payload: UpdateFeeStatusPayload) => patchRequest("/fees/update-status", payload),
};
