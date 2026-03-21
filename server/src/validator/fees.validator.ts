import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { FeeStatus, PaymentMethod } from "../models/fees.model";
import { FeeFiltersDTO, MarkFeePaidDTO, UpdateFeeStatusDTO } from "../dtos/fees/fees.dto";

const isValidMonth = (value: number) => Number.isInteger(value) && value >= 1 && value <= 12;
const isValidYear = (value: number) => Number.isInteger(value) && value >= 2000 && value <= 2100;

export const validateFeeFilters = (query: FeeFiltersDTO): FeeFiltersDTO => {
  const month = Number(query.month);
  const year = Number(query.year);

  if (!isValidMonth(month)) {
    throwError("month must be between 1 and 12", StatusCode.BAD_REQUEST);
  }
  if (!isValidYear(year)) {
    throwError("year must be a valid year", StatusCode.BAD_REQUEST);
  }

  if (query.batchId && !mongoose.Types.ObjectId.isValid(query.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }

  return {
    month,
    year,
    batchId: query.batchId,
    status: query.status,
  };
};

export const validateMarkFeePaid = (payload: MarkFeePaidDTO): void => {
  if (!payload.studentId || !payload.batchId) {
    throwError("studentId and batchId are required", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(payload.studentId)) {
    throwError("Invalid studentId", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(payload.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
  if (!isValidMonth(payload.month) || !isValidYear(payload.year)) {
    throwError("Invalid month or year", StatusCode.BAD_REQUEST);
  }
  if (!payload.paymentMethod || !["Cash", "UPI", "Bank"].includes(payload.paymentMethod)) {
    throwError("Invalid payment method", StatusCode.BAD_REQUEST);
  }
  if (payload.markedByUserId && !mongoose.Types.ObjectId.isValid(payload.markedByUserId)) {
    throwError("Invalid markedByUserId", StatusCode.BAD_REQUEST);
  }
};

export const validateUpdateFeeStatus = (payload: UpdateFeeStatusDTO): void => {
  if (!payload.studentId || !payload.batchId) {
    throwError("studentId and batchId are required", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(payload.studentId)) {
    throwError("Invalid studentId", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(payload.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
  if (!isValidMonth(payload.month) || !isValidYear(payload.year)) {
    throwError("Invalid month or year", StatusCode.BAD_REQUEST);
  }
  if (!payload.status || !["Paid", "Pending", "Overdue"].includes(payload.status)) {
    throwError("Invalid status", StatusCode.BAD_REQUEST);
  }
};

export const validatePendingFeesQuery = (month?: string, year?: string): { month?: number; year?: number } => {
  if (!month || !year) {
    return {};
  }
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  if (!isValidMonth(parsedMonth) || !isValidYear(parsedYear)) {
    throwError("Invalid month or year", StatusCode.BAD_REQUEST);
  }
  return { month: parsedMonth, year: parsedYear };
};
