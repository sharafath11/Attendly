import express from "express";
import { waStatus, waQrCode } from "../controller/whatsapp.controller";
import { requireRole } from "../shared/middleware/role.middleware";

const router = express.Router();

/**
 * WhatsApp integration status and QR link accessible to center_owners and super_admins.
 */
router.get("/status", requireRole(["center_owner", "super_admin"]), waStatus);
router.get("/qr", requireRole(["center_owner", "super_admin"]), waQrCode);

export default router;
