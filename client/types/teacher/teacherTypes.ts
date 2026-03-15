export type Teacher = {
  id: string;
  name: string;
  username: string;
  phone?: string;
  subjects?: string[];
  salary?: number;
  status: "active" | "disabled";
  centerId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTeacherPayload = {
  name: string;
  phone: string;
  subjects?: string[];
  salary?: number;
};

export type CreateTeacherResponse = {
  username: string;
  temporaryPassword: string;
};

export type UpdateTeacherPayload = {
  name?: string;
  phone?: string;
  subjects?: string[];
  salary?: number;
};

export type UpdateTeacherStatusPayload = {
  status: "active" | "disabled";
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
