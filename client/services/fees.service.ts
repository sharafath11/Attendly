import { feesApi } from "./fees.api";
import type { FeeFilters, MarkFeePaidPayload, UpdateFeeStatusPayload } from "@/types/fees/feesTypes";

export const feesService = {
  getFees: (params: FeeFilters) => feesApi.getFees(params),
  getPendingFees: (params?: { month?: number; year?: number }) => feesApi.getPendingFees(params),
  markPaid: (payload: MarkFeePaidPayload) => feesApi.markPaid(payload),
  updateStatus: (payload: UpdateFeeStatusPayload) => feesApi.updateStatus(payload),
};
