import mongoose from "mongoose";
import { throwError } from "../../utils/response";
import { MESSAGES } from "../../const/messages";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "./students.dto";
import { StatusCode } from "../../enums/statusCode";

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

const isValidDate = (value: string | Date) => !Number.isNaN(Date.parse(String(value)));

export const validateCreateStudent = (payload: CreateStudentDTO): void => {
  if (!payload.name || !payload.phone || !payload.batchId || payload.monthlyFee === undefined || !payload.joinDate) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  if (payload.parentPhone && !PHONE_REGEX.test(payload.parentPhone)) {
    throwError("Invalid parent phone number", StatusCode.BAD_REQUEST);
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

  if (payload.parentPhone && !PHONE_REGEX.test(payload.parentPhone)) {
    throwError("Invalid parent phone number", StatusCode.BAD_REQUEST);
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
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  if (Number.isNaN(page) || page <= 0) {
    throwError("page must be a positive number", StatusCode.BAD_REQUEST);
  }

  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    throwError("limit must be between 1 and 100", StatusCode.BAD_REQUEST);
  }

  if (query.batchId && !mongoose.Types.ObjectId.isValid(query.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }

  return {
    search: query.search,
    batchId: query.batchId,
    page,
    limit,
  };
};
