import mongoose from "mongoose";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { BlockCenterDTO, UpdatePaymentStatusDTO } from "../dtos/admin/admin.dto";
import { MESSAGES } from "../const/messages";

const isValidDate = (value: string | Date) => !Number.isNaN(Date.parse(String(value)));

export const validateCenterIdParam = (centerId?: string): void => {
  if (!centerId || !mongoose.Types.ObjectId.isValid(centerId)) {
    throwError("Invalid center id", StatusCode.BAD_REQUEST);
  }
};

export const validateUserIdParam = (userId?: string): void => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throwError("Invalid user id", StatusCode.BAD_REQUEST);
  }
};

export const validateBlockCenter = (payload: BlockCenterDTO): void => {
  if (!payload.blockedReason && !payload.reason) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }
};

export const validateUpdatePaymentStatus = (payload: UpdatePaymentStatusDTO): void => {
  if (!payload.subscriptionStatus) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!["active", "pending_payment", "expired", "blocked"].includes(payload.subscriptionStatus)) {
    throwError("Invalid subscription status", StatusCode.BAD_REQUEST);
  }

  if (payload.lastPaymentDate && !isValidDate(payload.lastPaymentDate)) {
    throwError("Invalid lastPaymentDate", StatusCode.BAD_REQUEST);
  }

  if (payload.subscriptionStartDate && !isValidDate(payload.subscriptionStartDate)) {
    throwError("Invalid subscriptionStartDate", StatusCode.BAD_REQUEST);
  }

  if (payload.subscriptionEndDate && !isValidDate(payload.subscriptionEndDate)) {
    throwError("Invalid subscriptionEndDate", StatusCode.BAD_REQUEST);
  }
};
