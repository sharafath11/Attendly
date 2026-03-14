import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IAttendanceController } from "../core/interfaces/controllers/IAttendanceController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();

const attendanceController = container.resolve<IAttendanceController>(TYPES.IAttendanceController);

router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  attendanceController.getAttendanceByBatchAndDate.bind(attendanceController)
);
router.get(
  "/history",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  attendanceController.getAttendanceHistory.bind(attendanceController)
);
router.post(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  attendanceController.saveAttendance.bind(attendanceController)
);

router.get(
  "/student/:studentId/summary",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  attendanceController.getStudentAttendanceSummary.bind(attendanceController)
);

router.get(
  "/batch/:batchId/summary",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  attendanceController.getBatchAttendanceSummary.bind(attendanceController)
);

router.get(
  "/batch/:batchId/low-attendance",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  attendanceController.getLowAttendanceStudents.bind(attendanceController)
);

export default router;
