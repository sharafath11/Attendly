import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { ITeacherController } from "../core/interfaces/controllers/ITeacherController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();
const teacherController = container.resolve<ITeacherController>(TYPES.ITeacherController);

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

export default router;
