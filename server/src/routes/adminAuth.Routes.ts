import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IAdminAuthController } from "../core/interfaces/controllers/IAdminAuthController";
import { requireAdminRole } from "../shared/middleware/role.middleware";

const router = express.Router();
const adminAuthController = container.resolve<IAdminAuthController>(TYPES.IAdminAuthController);

router.post("/login", adminAuthController.login.bind(adminAuthController));
router.get("/me", requireAdminRole(["super_admin"]), adminAuthController.me.bind(adminAuthController));
router.post("/refresh-token", adminAuthController.refreshToken.bind(adminAuthController));
router.post("/logout", requireAdminRole(["super_admin"]), adminAuthController.logout.bind(adminAuthController));

export default router;
