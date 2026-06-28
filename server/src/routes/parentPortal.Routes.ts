import express from "express";
import { requireParentAuth } from "../shared/middleware/parent.middleware";
import { ParentPortalController } from "../controller/parentPortal.controller";

const router = express.Router();
const controller = new ParentPortalController();

// All parent portal routes require the authenticated "parent" role via parentToken
router.get(
  "/my-children",
  requireParentAuth,
  controller.getMyChildren.bind(controller)
);

router.get(
  "/child/:studentId/fees",
  requireParentAuth,
  controller.getChildFees.bind(controller)
);

router.get(
  "/child/:studentId/attendance",
  requireParentAuth,
  controller.getChildAttendance.bind(controller)
);

router.get(
  "/child/:studentId/reports",
  requireParentAuth,
  controller.getChildReports.bind(controller)
);

export default router;
