import express from "express";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { SocketService } from "../services/socket.service";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { logActivity } from "../utils/activityLog.util";

const router = express.Router();

router.post(
  "/monthly",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  async (req, res, next) => {
    try {
      const { month, year } = req.body ?? {};
      const { centerId, authUserId } = req as AuthenticatedRequest;

      if (!month || !year || !centerId) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Month and year required", false);
        return;
      }

      const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });

      // Generate activity log
      await logActivity({
        centerId,
        actorUserId: authUserId || "",
        action: "report_generated",
        entityType: "report",
        summary: `Monthly report generated for ${monthName} ${year}`,
      });

      // Push real-time Socket.io notification (persisted to database)
      await SocketService.createAndSendNotification(
        centerId,
        authUserId || "",
        "Monthly Report Generated",
        `Monthly report for ${monthName} ${year} has been generated successfully!`,
        "monthly_report_generated",
        { month, year }
      );

      sendResponse(res, StatusCode.OK, "Monthly report generated successfully", true, {
        month,
        year,
        monthName,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
