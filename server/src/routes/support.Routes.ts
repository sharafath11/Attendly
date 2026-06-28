import express from "express";
import { getWAClient, getWAStatus } from "../services/whatsappAuth.service";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 3 messages per 15 minutes per IP address
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3,
  message: { success: false, message: "Too many support requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/message", supportLimiter, async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
      return sendResponse(res, StatusCode.BAD_REQUEST, "Missing required fields.", false);
    }

    const personalNumber = process.env.PERSONAL_WHATSAPP_NUMBER;
    if (!personalNumber) {
      return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, "Support contact not configured.", false);
    }

    const formattedMessage = `🚨 *NEW INQUIRY FROM ATTENDLY LANDING PAGE*\n\n👤 *Name:* ${name}\n📱 *Contact:* ${phone}\n✉️ *Message:* ${message}`;

    const center = await (await import("../models/center.model")).CenterModel.findOne({ whatsappStatus: "Connected" }).select('_id').lean();
    
    if (center) {
      const client = getWAClient(center._id.toString());
      if (client && getWAStatus(center._id.toString()) === "open") {
        const waWebJid = `${personalNumber}@c.us`;
        await client.sendMessage(waWebJid, formattedMessage);
        return sendResponse(res, StatusCode.OK, "Message dispatched safely.", true);
      }
    }
    
    return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, "No active WhatsApp client available.", false);

  } catch (error) {
    console.error("[Support Route] Error processing support message:", error);
    return sendResponse(res, StatusCode.INTERNAL_SERVER_ERROR, "Failed to send message.", false);
  }
});

export default router;
