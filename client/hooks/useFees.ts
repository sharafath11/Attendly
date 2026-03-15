import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feesService } from "@/services/fees.service";
import type { ApiResponse, FeeFilters, FeeRecord, MarkFeePaidPayload, UpdateFeeStatusPayload } from "@/types/fees/feesTypes";

export const useFees = (filters: FeeFilters) => {
  return useQuery<ApiResponse<FeeRecord[]> | null>({
    queryKey: ["fees", filters],
    queryFn: () => feesService.getFees(filters),
    placeholderData: keepPreviousData,
  });
};

export const usePendingFees = (params?: { month?: number; year?: number }) => {
  return useQuery<ApiResponse<FeeRecord[]> | null>({
    queryKey: ["fees", "pending", params],
    queryFn: () => feesService.getPendingFees(params),
    placeholderData: keepPreviousData,
  });
};

export const useMarkFeePaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkFeePaidPayload) => feesService.markPaid(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });
};

export const useUpdateFeeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFeeStatusPayload) => feesService.updateStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
    },
  });
};
