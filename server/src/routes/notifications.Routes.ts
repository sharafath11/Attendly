import express from "express";
import { container } from "../core/di/container";
import { NotificationController } from "../controller/notification.controller";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();
const c = container.resolve(NotificationController);

router.post(
  "/fee-reminder/:studentId",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  c.feeReminder.bind(c)
);

router.post(
  "/attendance-alert",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  c.attendanceAlert.bind(c)
);

router.post(
  "/broadcast",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  c.broadcast.bind(c)
);

export default router;
