export type FeeStatus = "Paid" | "Pending" | "Overdue";
export type PaymentMethod = "Cash" | "UPI" | "Bank";

export type FeeStudent = {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  monthlyFee: number;
};

export type FeeBatch = {
  id: string;
  batchName: string;
  classLevel: string;
  session: string;
  medium: string;
};

export type FeeRecord = {
  id: string;
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  amount: number;
  status: FeeStatus;
  paymentMethod?: PaymentMethod;
  paidDate?: string;
  markedBy?: string;
  editedBy?: string;
  changeNote?: string;
  editHistory: {
    editedBy: string;
    previousStatus: FeeStatus;
    newStatus: FeeStatus;
    note?: string;
    editedAt: string;
  }[];
  student: FeeStudent;
  batch: FeeBatch;
  createdAt: string;
  updatedAt: string;
};

export type FeeFilters = {
  month: number;
  year: number;
  batchId?: string;
  status?: FeeStatus | "All";
};

export type MarkFeePaidPayload = {
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  paymentMethod: PaymentMethod;
};

export type UpdateFeeStatusPayload = {
  studentId: string;
  batchId: string;
  month: number;
  year: number;
  status: FeeStatus;
  changeNote?: string;
};

export type ApiResponse<T> = {
  ok: boolean;
  msg: string;
  data: T;
};
