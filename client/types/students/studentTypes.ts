export type Student = {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: string;
  monthlyFee: number;
  joinDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentsQuery = {
  search?: string;
  batchId?: string;
  page?: number;
  limit?: number;
};

export type CreateStudentPayload = {
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: string;
  monthlyFee: number;
  joinDate: string;
};

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export type StudentsListResponse = {
  students: Student[];
  total: number;
  page: number;
  pages: number;
};

export type ApiResponse<T> = {
  ok: boolean;
  msg: string;
  data: T;
};
