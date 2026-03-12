import { AuthController } from "../../controller/auth.controller";
import { AuthRepository } from "../../repository/authRepository";
import { AuthService } from "../../services/auth.Service";
import { IAuthController } from "../interfaces/controllers/IAuth.Controller";
import { IAuthRepository } from "../interfaces/repository/IAuthRepository";
import { IAuthService } from "../interfaces/services/IAuthService";
import { TYPES } from "../types";
import { container } from "tsyringe";
import { StudentsController } from "../../controller/students.controller";
import { StudentsRepository } from "../../repository/students.repository";
import { StudentsService } from "../../services/students.service";
import { IStudentsController } from "../interfaces/controllers/IStudentsController";
import { IStudentsRepository } from "../interfaces/repository/IStudentsRepository";
import { IStudentsService } from "../interfaces/services/IStudentsService";
import { BatchesController } from "../../controller/batches.controller";
import { BatchesRepository } from "../../repository/batches.repository";
import { BatchesService } from "../../services/batches.service";
import { IBatchesController } from "../interfaces/controllers/IBatchesController";
import { IBatchesRepository } from "../interfaces/repository/IBatchesRepository";
import { IBatchesService } from "../interfaces/services/IBatchesService";

container.registerSingleton<IAuthService>(TYPES.IAuthServices, AuthService);
container.registerSingleton<IAuthController>(TYPES.IAuthController, AuthController);
container.registerSingleton<IAuthRepository>(TYPES.IAuthRepository, AuthRepository);

container.registerSingleton<IStudentsService>(TYPES.IStudentsService, StudentsService);
container.registerSingleton<IStudentsController>(TYPES.IStudentsController, StudentsController);
container.registerSingleton<IStudentsRepository>(TYPES.IStudentsRepository, StudentsRepository);

container.registerSingleton<IBatchesService>(TYPES.IBatchesService, BatchesService);
container.registerSingleton<IBatchesController>(TYPES.IBatchesController, BatchesController);
container.registerSingleton<IBatchesRepository>(TYPES.IBatchesRepository, BatchesRepository);

export { container };
