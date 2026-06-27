import { Request, Response } from "express";
import QRCode from "qrcode";
import {
  getWAStatus,
  getLatestQr,
  initWhatsApp,
} from "../services/whatsappAuth.service";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

/**
 * GET /api/whatsapp/status
 * Returns current connection status and whether QR is available.
 */
export async function waStatus(req: Request, res: Response): Promise<void> {
  const { centerId } = req as any; // Using any or AuthenticatedRequest
  if (!centerId) {
    sendResponse(res, StatusCode.UNAUTHORIZED, "No center context", false);
    return;
  }
  const status = getWAStatus(centerId);
  const hasQr = Boolean(getLatestQr(centerId));
  sendResponse(res, StatusCode.OK, "OK", true, { status, hasQr });
}

/**
 * GET /api/whatsapp/qr
 * Returns the latest QR code as a base64 PNG data URI.
 * The center owner opens this in the browser, scans with WhatsApp.
 */
export async function waQrCode(req: Request, res: Response): Promise<void> {
  const { centerId } = req as any;
  if (!centerId) {
    sendResponse(res, StatusCode.UNAUTHORIZED, "No center context", false);
    return;
  }
  const status = getWAStatus(centerId);

  if (status === "open") {
    sendResponse(res, StatusCode.OK, "Already connected — no QR needed.", true, {
      status,
    });
    return;
  }

  const qrString = getLatestQr(centerId);
  if (!qrString) {
    // Not connected and no QR yet — trigger init if needed
    initWhatsApp(centerId).catch((e) =>
      console.error(`[WA] initWhatsApp error in /qr route for ${centerId}:`, e)
    );
    sendResponse(
      res,
      StatusCode.OK,
      "WhatsApp is initializing. Retry in a few seconds.",
      true,
      { status: getWAStatus(centerId) }
    );
    return;
  }

  try {
    const dataUri = await QRCode.toDataURL(qrString);
    sendResponse(res, StatusCode.OK, "QR ready", true, {
      status,
      qr: dataUri,
    });
  } catch (err) {
    console.error("[WA] QR generation error", err);
    sendResponse(
      res,
      StatusCode.INTERNAL_SERVER_ERROR,
      "Failed to generate QR code",
      false
    );
  }
}
