import express from "express";
import rateLimit from "express-rate-limit";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IAuthController } from "../core/interfaces/controllers/IAuth.Controller";
import { authenticateToken } from "../middleware/authenticateToken";
import { sendResponse } from "../utils/response";

const router = express.Router();

const authController = container.resolve<IAuthController>(TYPES.IAuthController);

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      "Too many login attempts. Please try again later.",
      false
    );
  },
});

router.post("/login", loginRateLimiter, authController.login.bind(authController));
router.post("/signup", authController.signup.bind(authController));
router.post("/verify-otp", authController.verifyOtp.bind(authController));
router.post("/resend-otp", authController.resendOtp.bind(authController));
router.post("/google", authController.googleAuth.bind(authController));
router.get("/me",authenticateToken,authController.getCurrentUser.bind(authController))
router.post("/logout",authenticateToken,authController.logout.bind(authController))
router.post("/refresh-token",authController.refeshToken.bind(authController))
export default router;
