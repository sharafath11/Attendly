export interface IAdminAuthService {
  login(username: string, password: string): Promise<{ username: string; role: "super_admin" }>;
  me(tokenUserId: string): Promise<{ username: string; role: "super_admin" }>;
}
