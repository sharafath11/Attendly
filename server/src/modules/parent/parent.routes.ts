import express from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { ParentController } from "./parent.controller";
import { requireParentAuth } from "../../shared/middleware/parent.middleware";
import { sendResponse } from "../../utils/response";
import { ParentPortalController } from "../../controller/parentPortal.controller";
import { OwnerParentController } from "../../controller/ownerParent.controller";
import { tenantGuard } from "../../shared/middleware/tenant.middleware";
import { requireRole } from "../../shared/middleware/role.middleware";

const router = express.Router();

const parentController = container.resolve(ParentController);
const portalController = new ParentPortalController();
const ownerParentController = new OwnerParentController();
import { broadcastController } from "../../controller/broadcast.controller";

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(res, 429, "Too many OTP requests. Try again shortly.", false);
  },
});

// Authentication
router.post("/auth/request-otp", otpLimiter, parentController.requestOtp.bind(parentController));
router.post("/auth/verify-otp", parentController.verifyOtp.bind(parentController));
router.post("/auth/logout", parentController.logout.bind(parentController));
router.post("/auth/refresh-token", parentController.refresh.bind(parentController));

// Enforce tenantGuard for all portal routes
router.use(tenantGuard);

// Portal endpoints
router.get("/me", requireParentAuth, parentController.me.bind(parentController));
router.get("/dashboard", requireParentAuth, parentController.dashboard.bind(parentController));
router.get("/attendance", requireParentAuth, parentController.attendance.bind(parentController));
router.get("/fees", requireParentAuth, parentController.fees.bind(parentController));
router.get("/notifications", requireParentAuth, parentController.notifications.bind(parentController));

// Advanced child-specific portal endpoints (Deep multi-tenant security)
router.get("/my-children", requireParentAuth, portalController.getMyChildren.bind(portalController));
router.get("/child/:studentId/fees", requireParentAuth, portalController.getChildFees.bind(portalController));
router.get("/child/:studentId/attendance", requireParentAuth, portalController.getChildAttendance.bind(portalController));
router.get("/child/:studentId/reports", requireParentAuth, portalController.getChildReports.bind(portalController));
router.get("/child/:studentId/exams", requireParentAuth, portalController.getChildExams.bind(portalController));
router.get("/inbox", requireParentAuth, portalController.getMyNotifications.bind(portalController));

// =====================================
// === Owner Parent Management (RBAC) ===
// =====================================
router.get("/owner/list", requireRole(["center_owner"]), ownerParentController.listParents.bind(ownerParentController));
router.put("/owner/:parentId/status", requireRole(["center_owner"]), ownerParentController.toggleAccess.bind(ownerParentController));
router.post("/owner/broadcast", requireRole(["center_owner"]), ownerParentController.bulkBroadcast.bind(ownerParentController));
router.post("/owner/universal-broadcast", requireRole(["center_owner"]), broadcastController.sendBroadcast.bind(broadcastController));

export default router;
