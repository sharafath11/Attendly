import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { MESSAGES } from "../const/messages";
import { StatusCode } from "../enums/statusCode";
import { BatchFiltersDTO, CreateBatchDTO, UpdateBatchDTO } from "../dtos/batches/batches.dto";

const isNonEmptyString = (value?: string): boolean => Boolean(value && value.trim().length > 0);

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throwError("days must be an array", StatusCode.BAD_REQUEST);
  }

  const days = value.map((item) => String(item).trim()).filter(Boolean);
  if (days.length === 0) {
    throwError("days must include at least one day", StatusCode.BAD_REQUEST);
  }

  return days;
};

const normalizeOptionalObjectId = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (!mongoose.Types.ObjectId.isValid(normalized)) {
    throwError("teacherId must be a valid id", StatusCode.BAD_REQUEST);
  }

  return normalized;
};

export const validateCreateBatch = (payload: CreateBatchDTO): CreateBatchDTO => {
  if (
    !isNonEmptyString(payload.batchName) ||
    !isNonEmptyString(payload.classLevel) ||
    !isNonEmptyString(payload.medium) ||
    !isNonEmptyString(payload.session) ||
    !isNonEmptyString(payload.scheduleTime) ||
    payload.days === undefined
  ) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  const teacherId = normalizeOptionalObjectId(payload.teacherId);

  return {
    batchName: payload.batchName.trim(),
    classLevel: payload.classLevel.trim(),
    medium: payload.medium.trim(),
    session: payload.session.trim(),
    scheduleTime: payload.scheduleTime.trim(),
    days: ensureStringArray(payload.days),
    teacherId,
  };
};

export const validateUpdateBatch = (payload: UpdateBatchDTO): UpdateBatchDTO => {
  const updated: UpdateBatchDTO = {};

  if (payload.batchName !== undefined) {
    if (!isNonEmptyString(payload.batchName)) {
      throwError("batchName must be a non-empty string", StatusCode.BAD_REQUEST);
    }
    updated.batchName = payload.batchName.trim();
  }

  if (payload.classLevel !== undefined) {
    if (!isNonEmptyString(payload.classLevel)) {
      throwError("classLevel must be a non-empty string", StatusCode.BAD_REQUEST);
    }
    updated.classLevel = payload.classLevel.trim();
  }

  if (payload.medium !== undefined) {
    if (!isNonEmptyString(payload.medium)) {
      throwError("medium must be a non-empty string", StatusCode.BAD_REQUEST);
    }
    updated.medium = payload.medium.trim();
  }

  if (payload.session !== undefined) {
    if (!isNonEmptyString(payload.session)) {
      throwError("session must be a non-empty string", StatusCode.BAD_REQUEST);
    }
    updated.session = payload.session.trim();
  }

  if (payload.scheduleTime !== undefined) {
    if (!isNonEmptyString(payload.scheduleTime)) {
      throwError("scheduleTime must be a non-empty string", StatusCode.BAD_REQUEST);
    }
    updated.scheduleTime = payload.scheduleTime.trim();
  }

  if (payload.days !== undefined) {
    updated.days = ensureStringArray(payload.days);
  }

  if (payload.teacherId !== undefined) {
    updated.teacherId = normalizeOptionalObjectId(payload.teacherId);
  }

  return updated;
};

export const validateBatchFilters = (filters: BatchFiltersDTO): BatchFiltersDTO => {
  const medium = filters.medium?.trim();
  const session = filters.session?.trim();

  return {
    medium: medium ? medium : undefined,
    session: session ? session : undefined,
  };
};
