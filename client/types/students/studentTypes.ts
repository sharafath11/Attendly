export type Student = {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: string;
  monthlyFee: number;
  joinDate: string;
  userId: string;
  customId?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentsQuery = {
  search?: string;
  batchId?: string;
  session?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

export type PaginatedStudentsResponse = {
  success: boolean;
  data: Student[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
