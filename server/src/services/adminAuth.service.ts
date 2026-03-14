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

  async login(username: string, password: string): Promise<{ username: string; role: "super_admin" }> {
    const creds = this._adminAuthRepository.getAdminCredentials();
    console.log("username ",username,"password",password)
    if (username !== creds.username || password !== creds.password) {
      throwError("Invalid admin credentials", StatusCode.UNAUTHORIZED);
    }

    return { username, role: "super_admin" };
  }

  async me(tokenUserId: string): Promise<{ username: string; role: "super_admin" }> {
    if (!tokenUserId) {
      throwError("Invalid admin token", StatusCode.UNAUTHORIZED);
    }
    return { username: tokenUserId, role: "super_admin" };
  }
}
