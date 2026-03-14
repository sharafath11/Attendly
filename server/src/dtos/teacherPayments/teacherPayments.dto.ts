export interface CreateTeacherPaymentDTO {
  teacherId: string;
  amount: number;
  month: string;
  year: number;
  notes?: string;
}

export interface TeacherPaymentFiltersDTO {
  teacherId?: string;
  month?: string;
  year?: number;
}

export interface TeacherPaymentRecordDTO {
  id: string;
  teacherId: string;
  centerId: string;
  amount: number;
  month: string;
  year: number;
  notes?: string;
  paidDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  teacher?: {
    id: string;
    name: string;
    username?: string;
    phone?: string;
  };
}
