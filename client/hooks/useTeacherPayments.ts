import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherPaymentsService } from "@/services/teacherPayments.service";
import type {
  CreateTeacherPaymentPayload,
  TeacherPaymentFilters,
} from "@/types/teacherPayments/teacherPaymentsTypes";

export const useTeacherPayments = (filters?: TeacherPaymentFilters) => {
  return useQuery({
    queryKey: ["teacherPayments", filters],
    queryFn: () => teacherPaymentsService.getPayments(filters),
    keepPreviousData: true,
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
