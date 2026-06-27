import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../../core/types";
import { ITeacherController } from "../../core/interfaces/controllers/ITeacherController";
import { ITeacherAttendanceController } from "../../core/interfaces/controllers/ITeacherAttendanceController";
import { ITeacherPaymentsController } from "../../core/interfaces/controllers/ITeacherPaymentsController";
import { requireRole } from "../../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../../shared/middleware/subscription.middleware";
import { RemarksController } from "../../controller/remarks.controller";
import { tenantGuard } from "../../shared/middleware/tenant.middleware";

const router = express.Router();
const attendanceRouter = express.Router();
const paymentsRouter = express.Router();

const teacherController = container.resolve<ITeacherController>(TYPES.ITeacherController);
const attendanceController = container.resolve<ITeacherAttendanceController>(TYPES.ITeacherAttendanceController);
const paymentsController = container.resolve<ITeacherPaymentsController>(TYPES.ITeacherPaymentsController);
const remarksController = new RemarksController();

router.use(tenantGuard);
attendanceRouter.use(tenantGuard);
paymentsRouter.use(tenantGuard);

// === Core Teacher Routes (mounted at /api/teachers) ===
router.post(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherController.createTeacher.bind(teacherController)
);
router.get(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  teacherController.getTeachers.bind(teacherController)
);
router.get(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  teacherController.getTeacherById.bind(teacherController)
);
router.delete(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherController.deleteTeacher.bind(teacherController)
);
router.patch(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherController.updateTeacher.bind(teacherController)
);
router.patch(
  "/:id/status",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherController.updateTeacherStatus.bind(teacherController)
);
router.post(
  "/:id/reset-password",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherController.resetTeacherPassword.bind(teacherController)
);

// === Teacher Remarks Routes ===
router.get(
  "/remarks/predefined",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  remarksController.getPredefined.bind(remarksController)
);

router.post(
  "/remarks",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  remarksController.submitRemark.bind(remarksController)
);

// === Flat/General Resource Routes (mounted at /api/teacher-attendance and /api/teacher-payments) ===

attendanceRouter.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  attendanceController.getAttendance.bind(attendanceController)
);
attendanceRouter.post(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  attendanceController.saveAttendance.bind(attendanceController)
);

paymentsRouter.get(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  paymentsController.getPayments.bind(paymentsController)
);
paymentsRouter.post(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  paymentsController.createPayment.bind(paymentsController)
);

// === Nested Resource Routes under /api/teachers ===
router.use("/:id/attendance", (req, res, next) => {
  req.query.teacherId = req.params.id;
  req.body.teacherId = req.params.id;
  attendanceRouter(req, res, next);
});

router.use("/:id/payments", (req, res, next) => {
  req.query.teacherId = req.params.id;
  req.body.teacherId = req.params.id;
  paymentsRouter(req, res, next);
});

export { router as teacherRoutes, attendanceRouter as teacherAttendanceRoutes, paymentsRouter as teacherPaymentsRoutes };
export default router;
