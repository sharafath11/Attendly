import { SubscriptionStatus } from "../../models/center.model";

export interface CenterResponseDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  medium?: "English" | "Malayalam";
  status?: string;
  planType?: "basic" | "pro";
  teacherLimit?: number;
  studentLimit?: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  blocked: boolean;
  blockedReason?: string | null;
  blockedAt?: Date | null;
  planName?: string | null;
  monthlyFee?: number | null;
  lastPaymentDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
