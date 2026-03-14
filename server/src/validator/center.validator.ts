import { CenterRegistrationDTO } from "../dtos/centers/centerRegistration.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export const validateCenterRegistration = (payload: CenterRegistrationDTO): void => {
  if (
    !payload.centerName ||
    !payload.ownerName ||
    !payload.email ||
    !payload.phone ||
    !payload.password ||
    !payload.address ||
    !payload.medium ||
    !payload.planType
  ) {
    throwError(MESSAGES.COMMON.MISSING_FIELDS, StatusCode.BAD_REQUEST);
  }

  if (!/\S+@\S+\.\S+/.test(payload.email)) {
    throwError("Invalid email address", StatusCode.BAD_REQUEST);
  }

  if (!PHONE_REGEX.test(payload.phone)) {
    throwError("Invalid phone number", StatusCode.BAD_REQUEST);
  }

  if (!["English", "Malayalam"].includes(payload.medium)) {
    throwError("Invalid medium", StatusCode.BAD_REQUEST);
  }

  if (!["basic", "pro"].includes(payload.planType)) {
    throwError("Invalid planType", StatusCode.BAD_REQUEST);
  }
};
