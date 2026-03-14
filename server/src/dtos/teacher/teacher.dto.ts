export interface CreateTeacherDTO {
  name: string;
  phone: string;
  subjects?: string[];
  salary?: number;
}

export interface UpdateTeacherStatusDTO {
  status: "active" | "disabled";
}

export interface UpdateTeacherDTO {
  name?: string;
  phone?: string;
  subjects?: string[];
  salary?: number;
}

export interface CreateTeacherResponseDTO {
  username: string;
  temporaryPassword: string;
}

export interface TeacherResponseDTO {
  id: string;
  name: string;
  username: string;
  phone?: string;
  subjects?: string[];
  salary?: number;
  role: "teacher";
  centerId: string;
  status: "active" | "disabled";
  createdAt?: Date;
  updatedAt?: Date;
}
