import { getRequest, postRequest } from "./api";
import type {
  CreateTeacherPaymentPayload,
  TeacherPaymentFilters,
} from "@/types/teacherPayments/teacherPaymentsTypes";

export const teacherPaymentsApi = {
  getPayments: (params?: TeacherPaymentFilters) => getRequest("/teacher-payments", params),
  createPayment: (payload: CreateTeacherPaymentPayload) => postRequest("/teacher-payments", payload),
};
