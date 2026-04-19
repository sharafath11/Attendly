import express from "express";
import { container } from "../core/di/container";
import { ActivityLogController } from "../controller/activityLog.controller";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";

const router = express.Router();
const c = container.resolve(ActivityLogController);

router.get("/", requireRole(["center_owner"]), checkCenterBlocked, c.list.bind(c));

export default router;
