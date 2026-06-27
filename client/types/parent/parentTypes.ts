export interface ParentStudent {
  id: string;
  name: string;
}

export interface ParentUser {
  id: string;
  name: string;
  customId: string;
  phone: string;
  status: "active" | "disabled" | "pending";
  students: ParentStudent[];
}

export interface ParentListResponse {
  parents: ParentUser[];
  total: number;
  page: number;
  totalPages: number;
}
