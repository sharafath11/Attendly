export type TeacherPayment = {
  id: string;
  teacherId: string;
  centerId: string;
  amount: number;
  month: string;
  year: number;
  notes?: string;
  paidDate?: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    id: string;
    name: string;
    username?: string;
    phone?: string;
  };
};

export type CreateTeacherPaymentPayload = {
  teacherId: string;
  amount: number;
  month: string;
  year: number;
  notes?: string;
};

export type TeacherPaymentFilters = {
  teacherId?: string;
  month?: string;
  year?: number;
};
