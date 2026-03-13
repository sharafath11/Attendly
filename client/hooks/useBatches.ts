import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { batchesService } from "@/services/batches.service";
import { BatchFilters, CreateBatchPayload, UpdateBatchPayload } from "@/types/batches/batchTypes";

export const useBatches = (filters?: BatchFilters) => {
  const medium = filters?.medium ?? "";
  const session = filters?.session ?? "";

  return useQuery({
    queryKey: ["batches", medium, session],
    queryFn: () => batchesService.getBatches(filters),
    keepPreviousData: true,
  });
};

export const useBatch = (id?: string) => {
  return useQuery({
    queryKey: ["batches", "detail", id],
    queryFn: () => batchesService.getBatchById(id as string),
    enabled: Boolean(id),
    keepPreviousData: true,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBatchPayload) => batchesService.createBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBatchPayload }) =>
      batchesService.updateBatch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchesService.deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
};
