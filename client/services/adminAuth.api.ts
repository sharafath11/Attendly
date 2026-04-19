import { getRequest, postRequest } from "./api";

export const adminAuthApi = {
  login: (payload: { email: string; password: string }) => postRequest("/admin/auth/login", payload),
  me: () => getRequest("/admin/auth/me"),
  logout: () => postRequest("/admin/auth/logout", {}),
};
