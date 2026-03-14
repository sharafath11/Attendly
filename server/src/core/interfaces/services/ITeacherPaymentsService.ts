import {
  CreateTeacherPaymentDTO,
  TeacherPaymentFiltersDTO,
  TeacherPaymentRecordDTO,
} from "../../../dtos/teacherPayments/teacherPayments.dto";

export interface ITeacherPaymentsService {
  createPayment(authUserId: string, payload: CreateTeacherPaymentDTO): Promise<TeacherPaymentRecordDTO>;
  getPayments(authUserId: string, filters: TeacherPaymentFiltersDTO): Promise<TeacherPaymentRecordDTO[]>;
}
