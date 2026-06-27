import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { MESSAGES } from "../const/messages";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "../dtos/students/students.dto";
import { StatusCode } from "../enums/statusCode";

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;
const STRICT_10_DIGIT_PHONE_REGEX = /^\d{10}$/;

const isValidDate = (value: string | Date) => !Number.isNaN(Date.parse(String(value)));

export const validateCreateStudent = (payload: CreateStudentDTO): void => {
  if (!payload.name || !payload.phone || !payload.parentName || !payload.parentPhone || !payload.batchId || payload.monthlyFee === undefined || !payload.joinDate) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  if (!STRICT_10_DIGIT_PHONE_REGEX.test(payload.parentPhone)) {
    throwError("Invalid parent phone number. Must be exactly 10 digits.", StatusCode.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }

  if (typeof payload.monthlyFee !== "number" || Number.isNaN(payload.monthlyFee)) {
    throwError("monthlyFee must be a valid number", StatusCode.BAD_REQUEST);
  }

  if (!isValidDate(payload.joinDate)) {
    throwError("Invalid joinDate", StatusCode.BAD_REQUEST);
  }
};

export const validateUpdateStudent = (payload: UpdateStudentDTO): void => {
  if (payload.phone && !PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  if (payload.parentPhone && !STRICT_10_DIGIT_PHONE_REGEX.test(payload.parentPhone)) {
    throwError("Invalid parent phone number. Must be exactly 10 digits.", StatusCode.BAD_REQUEST);
  }

  if (payload.batchId && !mongoose.Types.ObjectId.isValid(payload.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }

  if (payload.monthlyFee !== undefined && (typeof payload.monthlyFee !== "number" || Number.isNaN(payload.monthlyFee))) {
    throwError("monthlyFee must be a valid number", StatusCode.BAD_REQUEST);
  }

  if (payload.joinDate && !isValidDate(payload.joinDate)) {
    throwError("Invalid joinDate", StatusCode.BAD_REQUEST);
  }
};

export const validateStudentsQuery = (query: StudentQueryDTO): StudentQueryDTO => {
  const page = query.page ? Number(query.page) : undefined;
  const limit = query.limit ? Number(query.limit) : 10;

  if (page !== undefined && (Number.isNaN(page) || page <= 0)) {
    throwError("page must be a positive number", StatusCode.BAD_REQUEST);
  }

  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    throwError("limit must be between 1 and 100", StatusCode.BAD_REQUEST);
  }

  if (query.batchId && !mongoose.Types.ObjectId.isValid(query.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }

  return {
    search: query.search ? String(query.search).trim() : undefined,
    batchId: query.batchId,
    session: query.session,
    page,
    limit,
    cursor: query.cursor ? String(query.cursor) : undefined,
    sortBy: query.sortBy ? String(query.sortBy) : undefined,
    sortOrder: query.sortOrder === "asc" || query.sortOrder === "desc" ? query.sortOrder : undefined,
  };
};
