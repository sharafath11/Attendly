import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IFeesController } from "../core/interfaces/controllers/IFeesController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();

const feesController = container.resolve<IFeesController>(TYPES.IFeesController);

router.get(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  feesController.getFees.bind(feesController)
);
router.get(
  "/pending",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  feesController.getPendingFees.bind(feesController)
);
router.post(
  "/mark-paid",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  feesController.markFeePaid.bind(feesController)
);
router.patch(
  "/update-status",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  feesController.updateFeeStatus.bind(feesController)
);

export default router;
