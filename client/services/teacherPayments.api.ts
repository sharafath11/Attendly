import { getRequest, postRequest } from "./api";
import type {
  ApiResponse,
  CreateTeacherPaymentPayload,
  TeacherPayment,
  TeacherPaymentFilters,
} from "@/types/teacherPayments/teacherPaymentsTypes";

export const teacherPaymentsApi = {
  getPayments: (params?: TeacherPaymentFilters) => getRequest<ApiResponse<TeacherPayment[]>>("/teacher-payments", params),
  createPayment: (payload: CreateTeacherPaymentPayload) =>
    postRequest<ApiResponse<any>>("/teacher-payments", payload),
};
