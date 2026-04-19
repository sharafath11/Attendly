import { IAdminAuthRepository } from "../core/interfaces/repository/IAdminAuthRepository";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

export class AdminAuthRepository implements IAdminAuthRepository {
  getAdminCredentials(): { email: string; password: string } {
    const email = process.env.ADMIN_EMAIL ?? process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throwError("Admin credentials not configured", StatusCode.INTERNAL_SERVER_ERROR);
    }

    return { email, password };
  }
}
