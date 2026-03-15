import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherPaymentsService } from "@/services/teacherPayments.service";
import type {
  ApiResponse,
  CreateTeacherPaymentPayload,
  TeacherPayment,
  TeacherPaymentFilters,
} from "@/types/teacherPayments/teacherPaymentsTypes";

export const useTeacherPayments = (filters?: TeacherPaymentFilters) => {
  return useQuery<ApiResponse<TeacherPayment[]> | null>({
    queryKey: ["teacherPayments", filters],
    queryFn: () => teacherPaymentsService.getPayments(filters),
    placeholderData: keepPreviousData,
  });
};

export const useCreateTeacherPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherPaymentPayload) => teacherPaymentsService.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherPayments"] });
    },
  });
};
