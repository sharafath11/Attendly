import { centersApi } from "./centers.api";
import { CenterRegistrationPayload } from "@/types/centers/centerTypes";

export const centersService = {
  registerCenter: (payload: CenterRegistrationPayload) => centersApi.registerCenter(payload),
  requestCenterOtp: (payload: CenterRegistrationPayload) => centersApi.requestCenterOtp(payload),
  verifyCenterOtp: (payload: { email: string; otp: string }) => centersApi.verifyCenterOtp(payload),
  resendCenterOtp: (payload: { email: string }) => centersApi.resendCenterOtp(payload),
  getCenterStatus: () => centersApi.getCenterStatus(),
  getMyCenter: () => centersApi.getMyCenter(),
};
