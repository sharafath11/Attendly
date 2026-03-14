import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { CreateTeacherDTO, UpdateTeacherDTO, UpdateTeacherStatusDTO } from "../dtos/teacher/teacher.dto";
import { MESSAGES } from "../const/messages";

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

const ALLOWED_SUBJECTS = [
  "Malayalam",
  "English",
  "Maths",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
];

const validateSubjects = (subjects?: string[]): string[] | undefined => {
  if (!subjects) return undefined;
  if (!Array.isArray(subjects)) {
    throwError("subjects must be an array", StatusCode.BAD_REQUEST);
  }
  const normalized = subjects
    .map((subject) => (typeof subject === "string" ? subject.trim() : ""))
    .filter((subject) => subject.length > 0);

  const invalid = normalized.filter((subject) => !ALLOWED_SUBJECTS.includes(subject));
  if (invalid.length > 0) {
    throwError(
      `Invalid subjects: ${invalid.join(
        ", "
      )}. Allowed subjects are: ${ALLOWED_SUBJECTS.join(", ")}`,
      StatusCode.BAD_REQUEST
    );
  }

  return normalized;
};

export const validateCreateTeacher = (payload: CreateTeacherDTO): void => {
  if (!payload.name || !payload.phone) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  payload.subjects = validateSubjects(payload.subjects);

  if (payload.salary !== undefined) {
    if (typeof payload.salary !== "number" || payload.salary < 0) {
      throwError("Invalid salary", StatusCode.BAD_REQUEST);
    }
  }
};

export const validateTeacherIdParam = (teacherId?: string): void => {
  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    throwError("Invalid teacherId", StatusCode.BAD_REQUEST);
  }
};

export const validateTeacherStatusUpdate = (payload: UpdateTeacherStatusDTO): void => {
  if (!payload.status) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!["active", "disabled"].includes(payload.status)) {
    throwError("Invalid status", StatusCode.BAD_REQUEST);
  }
};

export const validateUpdateTeacher = (payload: UpdateTeacherDTO): void => {
  if (!payload.name && !payload.phone && !payload.subjects && payload.salary === undefined) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (payload.phone && !PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  payload.subjects = validateSubjects(payload.subjects);

  if (payload.salary !== undefined) {
    if (typeof payload.salary !== "number" || payload.salary < 0) {
      throwError("Invalid salary", StatusCode.BAD_REQUEST);
    }
  }
};
