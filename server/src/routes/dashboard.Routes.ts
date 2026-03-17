import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IDashboardController } from "../core/interfaces/controllers/IDashboardController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";

const router = express.Router();
const dashboardController = container.resolve<IDashboardController>(TYPES.IDashboardController);

router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  dashboardController.getDashboard.bind(dashboardController)
);

export default router;
