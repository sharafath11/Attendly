export interface IAdminAuthRepository {
  getAdminCredentials(): { email: string; password: string };
}
