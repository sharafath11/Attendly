import express from "express";
import { container } from "../core/di/container";
import { AutomationController } from "../controller/automation.controller";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";

const router = express.Router();
const c = container.resolve(AutomationController);

router.get("/settings", requireRole(["center_owner"]), checkCenterBlocked, c.getSettings.bind(c));
router.patch("/settings", requireRole(["center_owner"]), checkCenterBlocked, c.patchSettings.bind(c));

export default router;
