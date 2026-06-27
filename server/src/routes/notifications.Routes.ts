import express from "express";
import { container } from "../core/di/container";
import { NotificationController } from "../controller/notification.controller";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

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

router.get(
  "/unread",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  async (req, res, next) => {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      const { UserNotificationModel } = await import("../models/userNotification.model");
      const notifications = await UserNotificationModel.find({
        userId: authUserId,
        isRead: false,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      sendResponse(res, StatusCode.OK, "Unread notifications fetched", true, notifications);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/mark-read",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  async (req, res, next) => {
    try {
      const { authUserId } = req as AuthenticatedRequest;
      const { notificationIds } = req.body ?? {};
      const { UserNotificationModel } = await import("../models/userNotification.model");

      const query: any = { userId: authUserId };
      if (Array.isArray(notificationIds) && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
      }

      await UserNotificationModel.updateMany(query, { isRead: true });

      sendResponse(res, StatusCode.OK, "Notifications marked as read", true);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
