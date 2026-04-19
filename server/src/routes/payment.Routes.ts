import express from "express";
import { container } from "../core/di/container";
import { PaymentController } from "../controller/payment.controller";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();
const c = container.resolve(PaymentController);

router.post(
  "/create-order",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  c.createOrder.bind(c)
);

router.post(
  "/verify",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  c.verify.bind(c)
);

router.get(
  "/history",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  c.history.bind(c)
);

export default router;
