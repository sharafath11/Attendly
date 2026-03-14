import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { ITeacherPaymentsController } from "../core/interfaces/controllers/ITeacherPaymentsController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();
const teacherPaymentsController = container.resolve<ITeacherPaymentsController>(TYPES.ITeacherPaymentsController);

router.get(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherPaymentsController.getPayments.bind(teacherPaymentsController)
);

router.post(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  teacherPaymentsController.createPayment.bind(teacherPaymentsController)
);

export default router;
