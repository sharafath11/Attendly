import { AuthController } from "../../controller/auth.controller";
import { AuthRepository } from "../../repository/authRepository";
import { AuthService } from "../../services/auth.Service";
import { IAuthController } from "../interfaces/controllers/IAuth.Controller";
import { IAuthRepository } from "../interfaces/repository/IAuthRepository";
import { IAuthService } from "../interfaces/services/IAuthService";
import { TYPES } from "../types";
import { container } from "tsyringe";
import { StudentsController } from "../../modules/students/students.controller";
import { StudentsRepository } from "../../modules/students/students.repository";
import { StudentsService } from "../../modules/students/students.service";
import { IStudentsController } from "../interfaces/controllers/IStudentsController";
import { IStudentsRepository } from "../interfaces/repository/IStudentsRepository";
import { IStudentsService } from "../interfaces/services/IStudentsService";

container.registerSingleton<IAuthService>(TYPES.IAuthServices, AuthService);
container.registerSingleton<IAuthController>(TYPES.IAuthController, AuthController);
container.registerSingleton<IAuthRepository>(TYPES.IAuthRepository, AuthRepository);

container.registerSingleton<IStudentsService>(TYPES.IStudentsService, StudentsService);
container.registerSingleton<IStudentsController>(TYPES.IStudentsController, StudentsController);
container.registerSingleton<IStudentsRepository>(TYPES.IStudentsRepository, StudentsRepository);

export { container };
