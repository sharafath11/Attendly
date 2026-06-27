import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parentApi } from "@/services/parent.api";
import { ParentListResponse } from "@/types/parent/parentTypes";

export const useInfiniteParents = (query: { search?: string }) => {
  return useInfiniteQuery({
    queryKey: ["parents", query],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await parentApi.getOwnerParents({
        page: pageParam,
        limit: 20,
        search: query.search,
      });
      if (!res.ok) throw new Error(res.message || "Failed to fetch parents");
      return res.data as ParentListResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useToggleParentAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, status }: { parentId: string; status: "active" | "disabled" }) =>
      parentApi.toggleParentAccess(parentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
    },
  });
};

export const useBulkBroadcast = () => {
  return useMutation({
    mutationFn: ({ parentIds, message }: { parentIds: string[]; message: string }) =>
      parentApi.bulkBroadcast(parentIds, message),
  });
};
