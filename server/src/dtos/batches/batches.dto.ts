export interface CreateBatchDTO {
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  teacherId?: string | null;
}

export interface UpdateBatchDTO {
  batchName?: string;
  classLevel?: string;
  medium?: string;
  session?: string;
  scheduleTime?: string;
  days?: string[];
  teacherId?: string | null;
}

export interface BatchResponseDTO {
  id: string;
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  teacherId?: string | null;
  userId: string;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchesListResponseDTO {
  batches: BatchResponseDTO[];
  total: number;
}

export interface BatchFiltersDTO {
  medium?: string;
  session?: string;
}
