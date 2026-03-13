import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IFeesController } from "../core/interfaces/controllers/IFeesController";
import { authMiddleware } from "../shared/middleware/auth.middleware";

const router = express.Router();

const feesController = container.resolve<IFeesController>(TYPES.IFeesController);

router.get("/", authMiddleware, feesController.getFees.bind(feesController));
router.get("/pending", authMiddleware, feesController.getPendingFees.bind(feesController));
router.post("/mark-paid", authMiddleware, feesController.markFeePaid.bind(feesController));
router.patch("/update-status", authMiddleware, feesController.updateFeeStatus.bind(feesController));

export default router;
