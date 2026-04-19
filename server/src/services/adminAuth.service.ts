import { inject, injectable } from "tsyringe";
import { IAdminAuthService } from "../core/interfaces/services/IAdminAuthService";
import { IAdminAuthRepository } from "../core/interfaces/repository/IAdminAuthRepository";
import { TYPES } from "../core/types";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

@injectable()
export class AdminAuthService implements IAdminAuthService {
  constructor(
    @inject(TYPES.IAdminAuthRepository)
    private _adminAuthRepository: IAdminAuthRepository
  ) {}

  async login(email: string, password: string): Promise<{ email: string; role: "super_admin" }> {
    const creds = this._adminAuthRepository.getAdminCredentials();
    if (email !== creds.email || password !== creds.password) {
      throwError("Invalid admin credentials", StatusCode.UNAUTHORIZED);
    }

    return { email, role: "super_admin" };
  }

  async me(tokenUserId: string): Promise<{ email: string; role: "super_admin" }> {
    if (!tokenUserId) {
      throwError("Invalid admin token", StatusCode.UNAUTHORIZED);
    }
    return { email: tokenUserId, role: "super_admin" };
  }
}
