import { teacherPaymentsApi } from "./teacherPayments.api";
import type {
  CreateTeacherPaymentPayload,
  TeacherPaymentFilters,
} from "@/types/teacherPayments/teacherPaymentsTypes";

export const teacherPaymentsService = {
  getPayments: (filters?: TeacherPaymentFilters) => teacherPaymentsApi.getPayments(filters),
  createPayment: (payload: CreateTeacherPaymentPayload) => teacherPaymentsApi.createPayment(payload),
};
