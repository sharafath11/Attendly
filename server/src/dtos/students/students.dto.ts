export interface CreateStudentDTO {
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  batchId: string;
  monthlyFee: number;
  joinDate: string | Date;
}

export interface UpdateStudentDTO {
  name?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  batchId?: string;
  monthlyFee?: number;
  joinDate?: string | Date;
}

export interface StudentResponseDTO {
  id: string;
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  batchId: string;
  monthlyFee: number;
  joinDate: Date;
  userId: string;
  customId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentsListResponseDTO {
  students: StudentResponseDTO[];
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedStudentsResponseDTO {
  success: boolean;
  data: StudentResponseDTO[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface StudentQueryDTO {
  search?: string;
  batchId?: string;
  session?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
