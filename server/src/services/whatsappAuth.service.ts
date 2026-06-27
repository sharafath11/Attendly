import path from "path";
import { EventEmitter } from "events";
import { Client, LocalAuth } from "whatsapp-web.js";
import mongoose from "mongoose";
import cron from "node-cron";
import { CenterModel } from "../models/center.model";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WAConnectionStatus = "connecting" | "open" | "closed" | "qr";

// ─── Auth directory (resolved from env or project root) ──────────────────────

const AUTH_DIR = process.env.WA_AUTH_DIR
  ? path.resolve(process.env.WA_AUTH_DIR)
  : path.resolve(process.cwd(), "whatsapp-auth");

// ─── Singleton emitter so any module can listen ──────────────────────────────

export const waEvents = new EventEmitter();

// ─── State ───────────────────────────────────────────────────────────────────

const _clients = new Map<string, Client>();
const _statuses = new Map<string, WAConnectionStatus>();
const _qrs = new Map<string, string>();
const _initPromises = new Map<string, Promise<void>>();

// ─── Getters ─────────────────────────────────────────────────────────────────

export function getWAClient(centerId: string): Client | null {
  return _clients.get(centerId) || null;
}

export function getWAStatus(centerId: string): WAConnectionStatus {
  return _statuses.get(centerId) || "closed";
}

export function getLatestQr(centerId: string): string | null {
  return _qrs.get(centerId) || null;
}

// ─── Core: initialise / reconnect ────────────────────────────────────────────

import fs from "fs";

async function _connect(centerId: string): Promise<void> {
  if (_clients.has(centerId)) {
    console.log(`[WhatsApp] Client already exists for center ${centerId}`);
    return;
  }

  // Clear any orphaned SingletonLock files before booting
  const sessionDir = path.join(AUTH_DIR, `session-${centerId}`);
  const lockFile = path.join(sessionDir, "SingletonLock");
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
      console.log(`[WhatsApp] Cleared orphaned lockfile for center ${centerId}`);
    } catch (e) {
      console.warn(`[WhatsApp] Could not clear lockfile for center ${centerId}:`, e);
    }
  }

  _statuses.set(centerId, "connecting");
  waEvents.emit("status", { centerId, status: "connecting" });
  console.log(`[WhatsApp] Initializing WhatsApp-Web.js for center ${centerId}`);

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: centerId,
      dataPath: AUTH_DIR,
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    },
  });

  _clients.set(centerId, client);

  client.on("qr", (qr) => {
    _qrs.set(centerId, qr);
    _statuses.set(centerId, "qr");
    waEvents.emit("qr", { centerId, qr });
    waEvents.emit("status", { centerId, status: "qr" });
    console.log(`[WhatsApp] QR code ready for center ${centerId}`);
  });

  client.on("ready", () => {
    _qrs.delete(centerId);
    _statuses.set(centerId, "open");
    waEvents.emit("status", { centerId, status: "open" });
    console.log(`[WhatsApp] ✅ Connected and ready for center ${centerId}.`);
    
    // Sync status to database
    CenterModel.updateOne({ _id: new mongoose.Types.ObjectId(centerId) }, { whatsappStatus: "Connected" })
      .catch((err) => console.error(`[WhatsApp] Database update failed for ${centerId}:`, err));

    // Auto-retry pending/failed messages
    (async () => {
      try {
        const { getWAQueue } = await import("./whatsappQueue.service");
        const queue = getWAQueue();
        await queue.retryJobs();
        console.log(`[WhatsApp] Auto-triggered retries for failed jobs for ${centerId}.`);
      } catch (err) {
        console.error(`[WhatsApp] Failed to retry jobs for ${centerId}:`, err);
      }
    })();
  });

  client.on("authenticated", () => {
    console.log(`[WhatsApp] Authenticated successfully for center ${centerId}.`);
  });

  client.on("auth_failure", (msg) => {
    console.error(`[WhatsApp] Authentication failure for center ${centerId}:`, msg);
    _statuses.set(centerId, "closed");
    waEvents.emit("status", { centerId, status: "closed" });
    _initPromises.delete(centerId);
    _clients.delete(centerId);
    
    CenterModel.updateOne({ _id: new mongoose.Types.ObjectId(centerId) }, { whatsappStatus: "Disconnected" })
      .catch((err) => console.error(`[WhatsApp] Database update failed for ${centerId}:`, err));
  });

  client.on("disconnected", (reason) => {
    console.warn(`[WhatsApp] Disconnected for center ${centerId}. Reason: ${reason}`);
    _statuses.set(centerId, "closed");
    _qrs.delete(centerId);
    waEvents.emit("status", { centerId, status: "closed" });
    _initPromises.delete(centerId);
    _clients.delete(centerId);
    
    CenterModel.updateOne({ _id: new mongoose.Types.ObjectId(centerId) }, { whatsappStatus: "Disconnected" })
      .catch((err) => console.error(`[WhatsApp] Database update failed for ${centerId}:`, err));
  });

  try {
    await client.initialize();
  } catch (error) {
    console.error(`[WhatsApp] Initialization failed for center ${centerId}:`, error);
    _statuses.set(centerId, "closed");
    _initPromises.delete(centerId);
    _clients.delete(centerId);
  }
}

// ─── Public: called once from server startup ──────────────────────────────────

export async function initWhatsApp(centerId: string): Promise<void> {
  if (!centerId) return;
  const existingPromise = _initPromises.get(centerId);
  if (existingPromise) return existingPromise;
  
  const promise = _connect(centerId);
  _initPromises.set(centerId, promise);
  return promise;
}

/**
 * (A) Gracefully destroy a single client and release browser memory.
 * Called on disconnection, QR re-scan, or SIGTERM shutdown.
 */
export async function destroyWAClient(centerId: string): Promise<void> {
  const client = _clients.get(centerId);
  if (!client) return;

  _clients.delete(centerId);
  _statuses.set(centerId, "closed");
  _qrs.delete(centerId);
  _initPromises.delete(centerId);

  try {
    await client.destroy();
    console.log(`[WhatsApp] 🔌 Client destroyed cleanly for center ${centerId}`);
  } catch (e) {
    console.warn(`[WhatsApp] Error destroying client for center ${centerId}:`, e);
  }
}

/**
 * Destroy ALL active clients — used by the process SIGTERM trap.
 */
export async function destroyAllWAClients(): Promise<void> {
  const ids = Array.from(_clients.keys());
  if (ids.length === 0) return;
  console.log(`[WhatsApp] 🔌 Graceful shutdown — destroying ${ids.length} client(s)...`);
  await Promise.allSettled(ids.map(destroyWAClient));
  console.log("[WhatsApp] All clients destroyed.");
}

// ─── Public: send a text message (called by the BullMQ worker) ───────────────

export async function sendTextMessage(
  centerId: string,
  jid: string,
  text: string
): Promise<void> {
  const client = _clients.get(centerId);
  const status = _statuses.get(centerId);
  
  // On-Demand Validation: Check health strictly before sending
  if (client && status === "open") {
    try {
      const state = await client.getState();
      if (state !== "CONNECTED") {
        console.warn(`[WhatsApp] State for center ${centerId} is ${state}, attempting to send anyway but may fail.`);
      }
    } catch (error) {
      console.warn(`[WhatsApp] Could not get state for center ${centerId}, assuming disconnected:`, error);
      _statuses.set(centerId, "closed");
      throw new Error(`[WhatsApp] Cannot send for center ${centerId} — client disconnected.`);
    }
  }

  if (!client || status !== "open") {
    throw new Error(
      `[WhatsApp] Cannot send for center ${centerId} — status is "${status}". Is the QR linked?`
    );
  }
  
  // Convert Baileys jid format to whatsapp-web.js format
  const waWebJid = jid.replace("@s.whatsapp.net", "@c.us");
  
  await client.sendMessage(waWebJid, text);
}

// ─── Scheduled Status Cron (12 hours) ────────────────────────────────────────

cron.schedule("0 */12 * * *", async () => {
  console.log("[WhatsApp] Running 12-hour scheduled status validation for all centers...");
  try {
    const centers = await CenterModel.find({ whatsappStatus: "Connected" }).lean().exec();
    
    for (const center of centers) {
      const centerId = center._id.toString();
      const client = _clients.get(centerId);
      
      if (!client) {
        await CenterModel.updateOne({ _id: center._id }, { whatsappStatus: "Disconnected" });
        continue;
      }
      
      try {
        const state = await client.getState();
        if (state !== "CONNECTED") {
          console.warn(`[WhatsApp Cron] Center ${centerId} state is ${state}, marking as Disconnected.`);
          _statuses.set(centerId, "closed");
          _clients.delete(centerId);
          _initPromises.delete(centerId);
          await CenterModel.updateOne({ _id: center._id }, { whatsappStatus: "Disconnected" });
        }
      } catch (error) {
        console.error(`[WhatsApp Cron] Failed to get state for center ${centerId}:`, error);
        _statuses.set(centerId, "closed");
        _clients.delete(centerId);
        _initPromises.delete(centerId);
        await CenterModel.updateOne({ _id: center._id }, { whatsappStatus: "Disconnected" });
      }
    }
  } catch (err) {
    console.error("[WhatsApp Cron] Error during 12-hour validation check:", err);
  }
});
