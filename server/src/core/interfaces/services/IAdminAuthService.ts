export interface IAdminAuthService {
  login(email: string, password: string): Promise<{ email: string; role: "super_admin" }>;
  me(tokenUserId: string): Promise<{ email: string; role: "super_admin" }>;
}
