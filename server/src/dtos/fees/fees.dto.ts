import { FeeStatus, PaymentMethod } from "../../models/fees.model";

export interface FeeStudentDTO {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  monthlyFee: number;
}

export interface FeeBatchDTO {
  id: string;
  batchName: string;
  classLevel: string;
  session: string;
  medium: string;
}

export interface FeeRecordDTO {
  id: string;
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  amount: number;
  status: FeeStatus;
  paymentMethod?: PaymentMethod;
  paidDate?: Date;
  markedBy?: string;
  editedBy?: string;
  changeNote?: string;
  editHistory: {
    editedBy: string;
    previousStatus: FeeStatus;
    newStatus: FeeStatus;
    note?: string;
    editedAt: Date;
  }[];
  student: FeeStudentDTO;
  batch: FeeBatchDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeFiltersDTO {
  month: number;
  year: number;
  batchId?: string;
  status?: FeeStatus | "All";
}

export interface MarkFeePaidDTO {
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  paymentMethod: PaymentMethod;
}

export interface UpdateFeeStatusDTO {
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  status: FeeStatus;
  changeNote?: string;
}
