import { getRequest, postRequest } from "./api";
import { CenterRegistrationPayload } from "@/types/centers/centerTypes";

export const centersApi = {
  registerCenter: (payload: CenterRegistrationPayload) => postRequest("/centers/register", payload),
  getCenterStatus: () => getRequest("/centers/status"),
  getMyCenter: () => getRequest("/centers/my-center"),
};
