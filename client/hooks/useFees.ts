import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feesService } from "@/services/fees.service";
import type { FeeFilters, MarkFeePaidPayload, UpdateFeeStatusPayload } from "@/types/fees/feesTypes";

export const useFees = (filters: FeeFilters) => {
  return useQuery({
    queryKey: ["fees", filters],
    queryFn: () => feesService.getFees(filters),
    keepPreviousData: true,
  });
};

export const usePendingFees = (params?: { month?: number; year?: number }) => {
  return useQuery({
    queryKey: ["fees", "pending", params],
    queryFn: () => feesService.getPendingFees(params),
    keepPreviousData: true,
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
