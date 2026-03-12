import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IBatchesController } from "../core/interfaces/controllers/IBatchesController";
import { authMiddleware } from "../shared/middleware/auth.middleware";

const router = express.Router();

const batchesController = container.resolve<IBatchesController>(TYPES.IBatchesController);

router.post("/", authMiddleware, batchesController.createBatch.bind(batchesController));
router.get("/", authMiddleware, batchesController.getBatches.bind(batchesController));
router.get("/:id", authMiddleware, batchesController.getBatchById.bind(batchesController));
router.put("/:id", authMiddleware, batchesController.updateBatch.bind(batchesController));
router.delete("/:id", authMiddleware, batchesController.deleteBatch.bind(batchesController));

export default router;
