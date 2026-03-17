import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { ICenterController } from "../core/interfaces/controllers/ICenterController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";

const router = express.Router();
const centerController = container.resolve<ICenterController>(TYPES.ICenterController);

router.post("/register", centerController.registerCenter.bind(centerController));
router.post("/register/request-otp", centerController.requestCenterRegistrationOtp.bind(centerController));
router.post("/register/verify-otp", centerController.verifyCenterRegistrationOtp.bind(centerController));
router.post("/register/resend-otp", centerController.resendCenterRegistrationOtp.bind(centerController));
router.get(
  "/status",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  centerController.getCenterStatus.bind(centerController)
);
router.get(
  "/my-center",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  centerController.getMyCenter.bind(centerController)
);

export default router;
