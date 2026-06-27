import express from "express";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";
import { InvitationController } from "../controller/invitation.controller";

const router = express.Router();
const controller = new InvitationController();

router.post(
  "/invite-teacher",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  controller.inviteTeacher.bind(controller)
);

export default router;
