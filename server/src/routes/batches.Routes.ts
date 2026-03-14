import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IBatchesController } from "../core/interfaces/controllers/IBatchesController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();

const batchesController = container.resolve<IBatchesController>(TYPES.IBatchesController);

router.post(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  batchesController.createBatch.bind(batchesController)
);
router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  batchesController.getBatches.bind(batchesController)
);
router.get(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  batchesController.getBatchById.bind(batchesController)
);
router.put(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  batchesController.updateBatch.bind(batchesController)
);
router.delete(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  batchesController.deleteBatch.bind(batchesController)
);

export default router;
