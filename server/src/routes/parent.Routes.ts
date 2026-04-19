import express from "express";
import rateLimit from "express-rate-limit";
import { container } from "../core/di/container";
import { ParentAuthController } from "../controller/parentAuth.controller";
import { ParentPortalController } from "../controller/parentPortal.controller";
import { requireParentAuth } from "../shared/middleware/parent.middleware";
import { sendResponse } from "../utils/response";

const router = express.Router();

const parentAuth = container.resolve(ParentAuthController);
const parentPortal = container.resolve(ParentPortalController);

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(res, 429, "Too many OTP requests. Try again shortly.", false);
  },
});

router.post("/auth/request-otp", otpLimiter, parentAuth.requestOtp.bind(parentAuth));
router.post("/auth/verify-otp", parentAuth.verifyOtp.bind(parentAuth));
router.post("/auth/logout", parentAuth.logout.bind(parentAuth));
router.post("/auth/refresh-token", parentAuth.refresh.bind(parentAuth));

router.get("/me", requireParentAuth, parentAuth.me.bind(parentAuth));
router.get("/dashboard", requireParentAuth, parentPortal.dashboard.bind(parentPortal));
router.get("/attendance", requireParentAuth, parentPortal.attendance.bind(parentPortal));
router.get("/fees", requireParentAuth, parentPortal.fees.bind(parentPortal));
router.get("/notifications", requireParentAuth, parentPortal.notifications.bind(parentPortal));

export default router;
