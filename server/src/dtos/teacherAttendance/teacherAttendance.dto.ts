export interface CreateTeacherAttendanceDTO {
  teacherId: string;
  date: string;
  status: "present" | "absent" | "half_day";
  shift?: "morning" | "afternoon" | "evening" | "night";
  checkInTime?: string;
  checkOutTime?: string;
}

export interface TeacherAttendanceFiltersDTO {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  teacherId?: string;
}

export interface TeacherAttendanceRecordDTO {
  id: string;
  teacherId: string;
  centerId: string;
  date: string;
  status: "present" | "absent" | "half_day";
  shift?: "morning" | "afternoon" | "evening" | "night";
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: Date;
  updatedAt?: Date;
  teacher?: {
    id: string;
    name: string;
    username?: string;
    phone?: string;
  };
}
