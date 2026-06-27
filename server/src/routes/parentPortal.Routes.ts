import express from "express";
import { requireRole } from "../shared/middleware/role.middleware";
import { ParentPortalController } from "../controller/parentPortal.controller";

const router = express.Router();
const controller = new ParentPortalController();

// All parent portal routes require the authenticated "parent" role
router.get(
  "/my-children",
  requireRole(["parent"]),
  controller.getMyChildren.bind(controller)
);

router.get(
  "/child/:studentId/fees",
  requireRole(["parent"]),
  controller.getChildFees.bind(controller)
);

router.get(
  "/child/:studentId/attendance",
  requireRole(["parent"]),
  controller.getChildAttendance.bind(controller)
);

router.get(
  "/child/:studentId/reports",
  requireRole(["parent"]),
  controller.getChildReports.bind(controller)
);

export default router;
