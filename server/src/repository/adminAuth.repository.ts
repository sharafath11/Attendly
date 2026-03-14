import { IAdminAuthRepository } from "../core/interfaces/repository/IAdminAuthRepository";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import dotenv from "dotenv";
dotenv.config()
export class AdminAuthRepository implements IAdminAuthRepository {
  getAdminCredentials(): { username: string; password: string } {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    console.log(username,password,"from trpo");
    
    if (!username || !password) {
      throwError("Admin credentials not configured", StatusCode.INTERNAL_SERVER_ERROR);
    }

    return { username, password };
  }
}
