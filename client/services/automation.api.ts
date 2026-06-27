import { getRequest, patchRequest } from "./api";

export type AutomationSettings = {
  autoFeeGeneration: boolean;
  feeReminderEnabled: boolean;
  reminderDaysBefore: number;
  feeReminderDays: number[];
  attendanceAutoDefaultAbsent: boolean;
};

export const automationApi = {
  getSettings: () => getRequest<{ ok: boolean; data?: AutomationSettings & { _id?: string } }>("/automation/settings"),
  patchSettings: (body: Partial<AutomationSettings>) =>
    patchRequest<{ ok: boolean; data?: AutomationSettings }>("/automation/settings", body),
};
