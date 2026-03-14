export interface IAdminAuthRepository {
  getAdminCredentials(): { username: string; password: string };
}
