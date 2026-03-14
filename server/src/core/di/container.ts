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
import { AttendanceController } from "../../controller/attendance.controller";
import { AttendanceRepository } from "../../repository/attendance.repository";
import { AttendanceService } from "../../services/attendance.service";
import { IAttendanceController } from "../interfaces/controllers/IAttendanceController";
import { IAttendanceRepository } from "../interfaces/repository/IAttendanceRepository";
import { IAttendanceService } from "../interfaces/services/IAttendanceService";
import { FeesController } from "../../controller/fees.controller";
import { FeesRepository } from "../../repository/fees.repository";
import { FeesService } from "../../services/fees.service";
import { IFeesController } from "../interfaces/controllers/IFeesController";
import { IFeesRepository } from "../interfaces/repository/IFeesRepository";
import { IFeesService } from "../interfaces/services/IFeesService";
import { TeacherController } from "../../controller/teacher.controller";
import { TeacherService } from "../../services/teacher.service";
import { TeacherRepository } from "../../repository/teacher.repository";
import { ITeacherController } from "../interfaces/controllers/ITeacherController";
import { ITeacherService } from "../interfaces/services/ITeacherService";
import { ITeacherRepository } from "../interfaces/repository/ITeacherRepository";
import { TeacherPaymentsController } from "../../controller/teacherPayments.controller";
import { TeacherPaymentsService } from "../../services/teacherPayments.service";
import { TeacherPaymentsRepository } from "../../repository/teacherPayments.repository";
import { ITeacherPaymentsController } from "../interfaces/controllers/ITeacherPaymentsController";
import { ITeacherPaymentsService } from "../interfaces/services/ITeacherPaymentsService";
import { ITeacherPaymentsRepository } from "../interfaces/repository/ITeacherPaymentsRepository";
import { TeacherAttendanceController } from "../../controller/teacherAttendance.controller";
import { TeacherAttendanceService } from "../../services/teacherAttendance.service";
import { TeacherAttendanceRepository } from "../../repository/teacherAttendance.repository";
import { ITeacherAttendanceController } from "../interfaces/controllers/ITeacherAttendanceController";
import { ITeacherAttendanceService } from "../interfaces/services/ITeacherAttendanceService";
import { ITeacherAttendanceRepository } from "../interfaces/repository/ITeacherAttendanceRepository";
import { CenterRepository } from "../../repository/center.repository";
import { ICenterRepository } from "../interfaces/repository/ICenterRepository";
import { AdminRepository } from "../../repository/admin.repository";
import { IAdminRepository } from "../interfaces/repository/IAdminRepository";
import { AdminService } from "../../services/admin.service";
import { IAdminService } from "../interfaces/services/IAdminService";
import { AdminController } from "../../controller/admin.controller";
import { IAdminController } from "../interfaces/controllers/IAdminController";
import { AdminAuthRepository } from "../../repository/adminAuth.repository";
import { IAdminAuthRepository } from "../interfaces/repository/IAdminAuthRepository";
import { AdminAuthService } from "../../services/adminAuth.service";
import { IAdminAuthService } from "../interfaces/services/IAdminAuthService";
import { AdminAuthController } from "../../controller/adminAuth.controller";
import { IAdminAuthController } from "../interfaces/controllers/IAdminAuthController";
import { CenterController } from "../../controller/center.controller";
import { ICenterController } from "../interfaces/controllers/ICenterController";
import { CenterService } from "../../services/center.service";
import { ICenterService } from "../interfaces/services/ICenterService";

container.registerSingleton<IAuthService>(TYPES.IAuthServices, AuthService);
container.registerSingleton<IAuthController>(TYPES.IAuthController, AuthController);
container.registerSingleton<IAuthRepository>(TYPES.IAuthRepository, AuthRepository);

container.registerSingleton<IStudentsService>(TYPES.IStudentsService, StudentsService);
container.registerSingleton<IStudentsController>(TYPES.IStudentsController, StudentsController);
container.registerSingleton<IStudentsRepository>(TYPES.IStudentsRepository, StudentsRepository);

container.registerSingleton<IBatchesService>(TYPES.IBatchesService, BatchesService);
container.registerSingleton<IBatchesController>(TYPES.IBatchesController, BatchesController);
container.registerSingleton<IBatchesRepository>(TYPES.IBatchesRepository, BatchesRepository);

container.registerSingleton<IAttendanceService>(TYPES.IAttendanceService, AttendanceService);
container.registerSingleton<IAttendanceController>(TYPES.IAttendanceController, AttendanceController);
container.registerSingleton<IAttendanceRepository>(TYPES.IAttendanceRepository, AttendanceRepository);

container.registerSingleton<IFeesService>(TYPES.IFeesService, FeesService);
container.registerSingleton<IFeesController>(TYPES.IFeesController, FeesController);
container.registerSingleton<IFeesRepository>(TYPES.IFeesRepository, FeesRepository);

container.registerSingleton<ITeacherService>(TYPES.ITeacherService, TeacherService);
container.registerSingleton<ITeacherController>(TYPES.ITeacherController, TeacherController);
container.registerSingleton<ITeacherRepository>(TYPES.ITeacherRepository, TeacherRepository);

container.registerSingleton<ITeacherPaymentsService>(TYPES.ITeacherPaymentsService, TeacherPaymentsService);
container.registerSingleton<ITeacherPaymentsController>(TYPES.ITeacherPaymentsController, TeacherPaymentsController);
container.registerSingleton<ITeacherPaymentsRepository>(TYPES.ITeacherPaymentsRepository, TeacherPaymentsRepository);

container.registerSingleton<ITeacherAttendanceService>(TYPES.ITeacherAttendanceService, TeacherAttendanceService);
container.registerSingleton<ITeacherAttendanceController>(TYPES.ITeacherAttendanceController, TeacherAttendanceController);
container.registerSingleton<ITeacherAttendanceRepository>(TYPES.ITeacherAttendanceRepository, TeacherAttendanceRepository);

container.registerSingleton<ICenterRepository>(TYPES.ICenterRepository, CenterRepository);
container.registerSingleton<IAdminRepository>(TYPES.IAdminRepository, AdminRepository);
container.registerSingleton<IAdminService>(TYPES.IAdminService, AdminService);
container.registerSingleton<IAdminController>(TYPES.IAdminController, AdminController);

container.registerSingleton<IAdminAuthRepository>(TYPES.IAdminAuthRepository, AdminAuthRepository);
container.registerSingleton<IAdminAuthService>(TYPES.IAdminAuthService, AdminAuthService);
container.registerSingleton<IAdminAuthController>(TYPES.IAdminAuthController, AdminAuthController);

container.registerSingleton<ICenterService>(TYPES.ICenterService, CenterService);
container.registerSingleton<ICenterController>(TYPES.ICenterController, CenterController);

export { container };
