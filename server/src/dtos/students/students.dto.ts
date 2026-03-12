export interface CreateStudentDTO {
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: string;
  monthlyFee: number;
  joinDate: string | Date;
}

export interface UpdateStudentDTO {
  name?: string;
  phone?: string;
  parentPhone?: string;
  batchId?: string;
  monthlyFee?: number;
  joinDate?: string | Date;
}

export interface StudentResponseDTO {
  id: string;
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: string;
  monthlyFee: number;
  joinDate: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentsListResponseDTO {
  students: StudentResponseDTO[];
  total: number;
  page: number;
  pages: number;
}

export interface StudentQueryDTO {
  search?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}
