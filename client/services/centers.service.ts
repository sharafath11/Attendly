import { centersApi } from "./centers.api";
import { CenterRegistrationPayload } from "@/types/centers/centerTypes";

export const centersService = {
  registerCenter: (payload: CenterRegistrationPayload) => centersApi.registerCenter(payload),
  getCenterStatus: () => centersApi.getCenterStatus(),
  getMyCenter: () => centersApi.getMyCenter(),
};
