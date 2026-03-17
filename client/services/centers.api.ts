import { getRequest, postRequest } from "./api";
import { CenterRegistrationPayload } from "@/types/centers/centerTypes";

export const centersApi = {
  registerCenter: (payload: CenterRegistrationPayload) => postRequest("/centers/register", payload),
  requestCenterOtp: (payload: CenterRegistrationPayload) => postRequest("/centers/register/request-otp", payload),
  verifyCenterOtp: (payload: { email: string; otp: string }) =>
    postRequest("/centers/register/verify-otp", payload),
  resendCenterOtp: (payload: { email: string }) => postRequest("/centers/register/resend-otp", payload),
  getCenterStatus: () => getRequest("/centers/status"),
  getMyCenter: () => getRequest("/centers/my-center"),
};
