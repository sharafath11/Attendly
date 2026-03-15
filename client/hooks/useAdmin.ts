import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import {
  AdminCharts,
  AdminCenter,
  AdminCenterDetail,
  AdminDashboard,
  ApiResponse,
  BlockCenterPayload,
  UpdatePaymentStatusPayload,
} from "@/types/admin/adminTypes";

export const useAdminDashboard = () => {
  return useQuery<ApiResponse<AdminDashboard> | null>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminService.getDashboard(),
    placeholderData: keepPreviousData,
  });
};

export const useAdminDashboardCharts = () => {
  return useQuery<ApiResponse<AdminCharts> | null>({
    queryKey: ["admin", "charts"],
    queryFn: () => adminService.getDashboardCharts(),
    placeholderData: keepPreviousData,
  });
};

export const useAdminCenters = () => {
  return useQuery<ApiResponse<AdminCenter[]> | null>({
    queryKey: ["admin", "centers"],
    queryFn: () => adminService.getCenters(),
    placeholderData: keepPreviousData,
  });
};

export const useAdminCenter = (id?: string) => {
  return useQuery<ApiResponse<AdminCenterDetail> | null>({
    queryKey: ["admin", "centers", id],
    queryFn: () => adminService.getCenterById(id as string),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
};

export const useBlockCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BlockCenterPayload }) =>
      adminService.blockCenter(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useUnblockCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.unblockCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentStatusPayload }) =>
      adminService.updatePaymentStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useVerifyCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.verifyCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
    },
  });
};

export const useRejectCenter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.rejectCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
    },
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.verifyUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "centers", id] });
    },
  });
};

export const useUnverifyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.unverifyUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "centers", id] });
    },
  });
};
