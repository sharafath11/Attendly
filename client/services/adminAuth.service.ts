import { adminAuthApi } from "./adminAuth.api";

export const adminAuthService = {
  login: (payload: { username: string; password: string }) => adminAuthApi.login(payload),
  me: () => adminAuthApi.me(),
  logout: () => adminAuthApi.logout(),
};
