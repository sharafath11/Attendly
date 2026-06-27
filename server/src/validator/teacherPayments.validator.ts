import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { CreateTeacherPaymentDTO, TeacherPaymentFiltersDTO } from "../dtos/teacherPayments/teacherPayments.dto";

const isValidMonth = (value: number) => Number.isInteger(value) && value >= 1 && value <= 12;
const isValidYear = (value: number) => Number.isInteger(value) && value >= 2000 && value <= 2100;

export const validateCreateTeacherPayment = (payload: CreateTeacherPaymentDTO): CreateTeacherPaymentDTO => {
  if (!payload.teacherId || !payload.amount || payload.month === undefined || !payload.year) {
    throwError("teacherId, amount, month and year are required", StatusCode.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.teacherId)) {
    throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
  }

  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    throwError("amount must be a positive number", StatusCode.BAD_REQUEST);
  }

  const parsedMonth = Number(payload.month);
  if (!isValidMonth(parsedMonth)) {
    throwError("Invalid month (must be 1-12)", StatusCode.BAD_REQUEST);
  }

  if (!isValidYear(payload.year)) {
    throwError("Invalid year", StatusCode.BAD_REQUEST);
  }

  return {
    ...payload,
    month: parsedMonth,
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
  if (query.month !== undefined) {
    const parsedMonth = Number(query.month);
    if (!isValidMonth(parsedMonth)) {
      throwError("Invalid month (must be 1-12)", StatusCode.BAD_REQUEST);
    }
    filters.month = parsedMonth;
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
