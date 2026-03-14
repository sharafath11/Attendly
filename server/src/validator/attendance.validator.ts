import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

export const validateStudentIdParam = (studentId: string): void => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throwError("Invalid studentId", StatusCode.BAD_REQUEST);
  }
};

export const validateBatchIdParam = (batchId: string): void => {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
};

export const validateAttendanceQuery = (batchId?: string, date?: string): void => {
  if (!batchId) {
    throwError("batchId is required", StatusCode.BAD_REQUEST);
  }
  if (!date) {
    throwError("date is required", StatusCode.BAD_REQUEST);
  }
  if (batchId && !mongoose.Types.ObjectId.isValid(batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
  const parsed = date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throwError("Invalid date", StatusCode.BAD_REQUEST);
  }
};

export const validateCreateAttendancePayload = (
  payload: {
    batchId?: string;
    date?: string | Date;
    records?: { studentId: string; status: string }[];
    studentId?: string;
    status?: string;
  }
): void => {
  if (!payload.date) {
    throwError("date is required", StatusCode.BAD_REQUEST);
  }
  const parsed = payload.date ? new Date(payload.date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throwError("Invalid date", StatusCode.BAD_REQUEST);
  }

  if (payload.records && payload.records.length > 0) {
    if (!payload.batchId) {
      throwError("batchId is required", StatusCode.BAD_REQUEST);
    }
    if (!mongoose.Types.ObjectId.isValid(payload.batchId)) {
      throwError("Invalid batchId", StatusCode.BAD_REQUEST);
    }
    payload.records.forEach((record) => {
      if (!mongoose.Types.ObjectId.isValid(record.studentId)) {
        throwError("Invalid studentId", StatusCode.BAD_REQUEST);
      }
      if (!["present", "absent", "leave"].includes(record.status)) {
        throwError("Invalid attendance status", StatusCode.BAD_REQUEST);
      }
    });
    return;
  }

  if (!payload.studentId) {
    throwError("studentId is required", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(payload.studentId)) {
    throwError("Invalid studentId", StatusCode.BAD_REQUEST);
  }
  if (!payload.status || !["present", "absent", "leave"].includes(payload.status)) {
    throwError("Invalid attendance status", StatusCode.BAD_REQUEST);
  }
};

export const validateAttendanceHistoryFilters = (query: {
  studentId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
}): {
  studentId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
} => {
  if (query.studentId && !mongoose.Types.ObjectId.isValid(query.studentId)) {
    throwError("Invalid studentId", StatusCode.BAD_REQUEST);
  }
  if (query.batchId && !mongoose.Types.ObjectId.isValid(query.batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
  if (query.dateFrom) {
    const parsed = new Date(query.dateFrom);
    if (Number.isNaN(parsed.getTime())) {
      throwError("Invalid dateFrom", StatusCode.BAD_REQUEST);
    }
  }
  if (query.dateTo) {
    const parsed = new Date(query.dateTo);
    if (Number.isNaN(parsed.getTime())) {
      throwError("Invalid dateTo", StatusCode.BAD_REQUEST);
    }
  }
  return {
    studentId: query.studentId,
    batchId: query.batchId,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
};
