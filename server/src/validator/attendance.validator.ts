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
  batchId: string,
  date: string | Date,
  records: { studentId: string; status: string }[]
): void => {
  if (!batchId) {
    throwError("batchId is required", StatusCode.BAD_REQUEST);
  }
  if (!date) {
    throwError("date is required", StatusCode.BAD_REQUEST);
  }
  if (!Array.isArray(records) || records.length === 0) {
    throwError("records are required", StatusCode.BAD_REQUEST);
  }
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throwError("Invalid batchId", StatusCode.BAD_REQUEST);
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throwError("Invalid date", StatusCode.BAD_REQUEST);
  }
  records.forEach((record) => {
    if (!mongoose.Types.ObjectId.isValid(record.studentId)) {
      throwError("Invalid studentId", StatusCode.BAD_REQUEST);
    }
    if (record.status !== "Present" && record.status !== "Absent") {
      throwError("Invalid attendance status", StatusCode.BAD_REQUEST);
    }
  });
};
