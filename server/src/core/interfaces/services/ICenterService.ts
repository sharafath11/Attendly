import { CenterRegistrationDTO } from "../../../dtos/centers/centerRegistration.dto";

export interface ICenterService {
  registerCenter(payload: CenterRegistrationDTO): Promise<void>;
  requestCenterRegistrationOtp(payload: CenterRegistrationDTO): Promise<void>;
  verifyCenterRegistrationOtp(email: string, otp: string): Promise<void>;
  resendCenterRegistrationOtp(email: string): Promise<void>;
  getCenterStatus(centerId: string): Promise<{ subscriptionStatus: string }>;
  getMyCenter(centerId: string): Promise<{
    subscriptionStatus: string;
    subscriptionStartDate?: Date | null;
    subscriptionEndDate?: Date | null;
    planType?: string | null;
    blocked?: boolean;
    blockedReason?: string | null;
  }>;
}
