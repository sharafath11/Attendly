import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { CreateTeacherPaymentDTO, TeacherPaymentFiltersDTO } from "../dtos/teacherPayments/teacherPayments.dto";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalizeMonth = (value: string): string => {
  const trimmed = value.trim();
  const match = MONTHS.find((month) => month.toLowerCase() === trimmed.toLowerCase());
  if (!match) {
    throwError("Invalid month", StatusCode.BAD_REQUEST);
  }
  return match;
};

const isValidYear = (value: number) => Number.isInteger(value) && value >= 2000 && value <= 2100;

export const validateCreateTeacherPayment = (payload: CreateTeacherPaymentDTO): CreateTeacherPaymentDTO => {
  if (!payload.teacherId || !payload.amount || !payload.month || !payload.year) {
    throwError("teacherId, amount, month and year are required", StatusCode.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.teacherId)) {
    throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
  }

  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    throwError("amount must be a positive number", StatusCode.BAD_REQUEST);
  }

  if (!isValidYear(payload.year)) {
    throwError("Invalid year", StatusCode.BAD_REQUEST);
  }

  return {
    ...payload,
    month: normalizeMonth(payload.month),
    notes: payload.notes?.trim() || undefined,
  };
};

export const validateTeacherPaymentFilters = (query: TeacherPaymentFiltersDTO): TeacherPaymentFiltersDTO => {
  const filters: TeacherPaymentFiltersDTO = {};
  if (query.teacherId) {
    if (!mongoose.Types.ObjectId.isValid(query.teacherId)) {
      throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
    }
    filters.teacherId = query.teacherId;
  }
  if (query.month) {
    filters.month = normalizeMonth(query.month);
  }
  if (query.year !== undefined) {
    const parsedYear = Number(query.year);
    if (!isValidYear(parsedYear)) {
      throwError("Invalid year", StatusCode.BAD_REQUEST);
    }
    filters.year = parsedYear;
  }
  return filters;
};
