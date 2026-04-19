import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IAdminController } from "../core/interfaces/controllers/IAdminController";
import { requireAdminRole } from "../shared/middleware/role.middleware";

const router = express.Router();
const adminController = container.resolve<IAdminController>(TYPES.IAdminController);

router.get("/dashboard", requireAdminRole(["super_admin"]), adminController.getDashboard.bind(adminController));
router.get(
  "/dashboard/charts",
  requireAdminRole(["super_admin"]),
  adminController.getDashboardCharts.bind(adminController)
);
router.get("/metrics", requireAdminRole(["super_admin"]), adminController.getMetrics.bind(adminController));
router.get("/revenue", requireAdminRole(["super_admin"]), adminController.getRevenue.bind(adminController));
router.get("/users", requireAdminRole(["super_admin"]), adminController.listUsers.bind(adminController));
router.get("/logs", requireAdminRole(["super_admin"]), adminController.getLogs.bind(adminController));
router.get("/centers", requireAdminRole(["super_admin"]), adminController.listCenters.bind(adminController));
router.get("/centers/:id", requireAdminRole(["super_admin"]), adminController.getCenterById.bind(adminController));
router.post("/centers/:id/block", requireAdminRole(["super_admin"]), adminController.blockCenter.bind(adminController));
router.post(
  "/centers/:id/unblock",
  requireAdminRole(["super_admin"]),
  adminController.unblockCenter.bind(adminController)
);
router.post(
  "/centers/:id/payment-status",
  requireAdminRole(["super_admin"]),
  adminController.updatePaymentStatus.bind(adminController)
);
router.post("/centers/:id/verify", requireAdminRole(["super_admin"]), adminController.verifyCenter.bind(adminController));
router.post("/centers/:id/reject", requireAdminRole(["super_admin"]), adminController.rejectCenter.bind(adminController));
router.post(
  "/subscriptions/verify-payment/:centerId",
  requireAdminRole(["super_admin"]),
  adminController.verifySubscriptionPayment.bind(adminController)
);
router.post(
  "/subscriptions/reject-payment/:centerId",
  requireAdminRole(["super_admin"]),
  adminController.rejectSubscriptionPayment.bind(adminController)
);
router.post("/users/:id/verify", requireAdminRole(["super_admin"]), adminController.verifyUser.bind(adminController));
router.post(
  "/users/:id/unverify",
  requireAdminRole(["super_admin"]),
  adminController.unverifyUser.bind(adminController)
);
router.post("/users/:id/status", requireAdminRole(["super_admin"]), adminController.updateUserStatus.bind(adminController));

export default router;
