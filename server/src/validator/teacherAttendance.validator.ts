import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
} from "../dtos/teacherAttendance/teacherAttendance.dto";

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const validateCreateTeacherAttendance = (
  payload: CreateTeacherAttendanceDTO
): CreateTeacherAttendanceDTO => {
  if (!payload.teacherId || !payload.date || !payload.status) {
    throwError("teacherId, date and status are required", StatusCode.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.teacherId)) {
    throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
  }

  if (!isValidDate(payload.date)) {
    throwError("Invalid date", StatusCode.BAD_REQUEST);
  }

  if (!["present", "absent", "half_day"].includes(payload.status)) {
    throwError("Invalid status", StatusCode.BAD_REQUEST);
  }

  if (payload.shift && !["morning", "afternoon", "evening", "night"].includes(payload.shift)) {
    throwError("Invalid shift", StatusCode.BAD_REQUEST);
  }

  if (payload.checkInTime && !isValidTime(payload.checkInTime)) {
    throwError("Invalid checkInTime", StatusCode.BAD_REQUEST);
  }

  if (payload.checkOutTime && !isValidTime(payload.checkOutTime)) {
    throwError("Invalid checkOutTime", StatusCode.BAD_REQUEST);
  }

  return {
    ...payload,
    checkInTime: payload.checkInTime?.trim() || undefined,
    checkOutTime: payload.checkOutTime?.trim() || undefined,
  };
};

export const validateTeacherAttendanceFilters = (
  query: TeacherAttendanceFiltersDTO
): TeacherAttendanceFiltersDTO => {
  const filters: TeacherAttendanceFiltersDTO = {};
  if (query.teacherId) {
    if (!mongoose.Types.ObjectId.isValid(query.teacherId)) {
      throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
    }
    filters.teacherId = query.teacherId;
  }
  if (query.date) {
    if (!isValidDate(query.date)) {
      throwError("Invalid date", StatusCode.BAD_REQUEST);
    }
    filters.date = query.date;
  }
  if (query.dateFrom) {
    if (!isValidDate(query.dateFrom)) {
      throwError("Invalid dateFrom", StatusCode.BAD_REQUEST);
    }
    filters.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    if (!isValidDate(query.dateTo)) {
      throwError("Invalid dateTo", StatusCode.BAD_REQUEST);
    }
    filters.dateTo = query.dateTo;
  }
  return filters;
};
