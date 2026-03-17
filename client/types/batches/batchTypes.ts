export type Batch = {
  id: string;
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  studentCount: number;
  teacherId?: string | null;
  teacherName?: string;
};

export type BatchFilters = {
  medium?: string;
  session?: string;
};

export type CreateBatchPayload = {
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  teacherId?: string | null;
};

export type UpdateBatchPayload = Partial<CreateBatchPayload>;

export type BatchesListResponse = {
  batches: Batch[];
  total: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
