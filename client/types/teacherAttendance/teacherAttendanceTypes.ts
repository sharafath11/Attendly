export type TeacherAttendanceStatus = "present" | "absent" | "half_day";
export type TeacherShift = "morning" | "afternoon" | "evening" | "night";

export type TeacherAttendance = {
  id: string;
  teacherId: string;
  centerId: string;
  date: string;
  status: TeacherAttendanceStatus;
  shift?: TeacherShift;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    id: string;
    name: string;
    username?: string;
    phone?: string;
  };
};

export type CreateTeacherAttendancePayload = {
  teacherId: string;
  date: string;
  status: TeacherAttendanceStatus;
  shift?: TeacherShift;
  checkInTime?: string;
  checkOutTime?: string;
};

export type TeacherAttendanceFilters = {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  teacherId?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  ok: boolean;
  msg: string;
  data: T;
};
