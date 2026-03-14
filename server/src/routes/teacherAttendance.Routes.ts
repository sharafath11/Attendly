import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { ITeacherAttendanceController } from "../core/interfaces/controllers/ITeacherAttendanceController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();
const teacherAttendanceController = container.resolve<ITeacherAttendanceController>(
  TYPES.ITeacherAttendanceController
);

router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherAttendanceController.getAttendance.bind(teacherAttendanceController)
);

router.post(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherAttendanceController.saveAttendance.bind(teacherAttendanceController)
);

export default router;
