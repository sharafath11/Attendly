import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { BlockCenterPayload, UpdatePaymentStatusPayload } from "@/types/admin/adminTypes";

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminService.getDashboard(),
  });
};

export const useAdminDashboardCharts = () => {
  return useQuery({
    queryKey: ["admin", "charts"],
    queryFn: () => adminService.getDashboardCharts(),
  });
};

export const useAdminCenters = () => {
  return useQuery({
    queryKey: ["admin", "centers"],
    queryFn: () => adminService.getCenters(),
  });
};

export const useAdminCenter = (id?: string) => {
  return useQuery({
    queryKey: ["admin", "centers", id],
    queryFn: () => adminService.getCenterById(id as string),
    enabled: Boolean(id),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "centers", id] });
    },
  });
};

export const useUnverifyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.unverifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "centers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "centers", id] });
    },
  });
};
