import {
  CreateTeacherPaymentDTO,
  TeacherPaymentFiltersDTO,
  TeacherPaymentRecordDTO,
} from "../../../dtos/teacherPayments/teacherPayments.dto";

export interface ITeacherPaymentsRepository {
  createPayment(centerId: string, payload: CreateTeacherPaymentDTO): Promise<TeacherPaymentRecordDTO>;
  getPayments(centerId: string, filters: TeacherPaymentFiltersDTO): Promise<TeacherPaymentRecordDTO[]>;
}
