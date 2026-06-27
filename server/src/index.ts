import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { SocketService } from "./services/socket.service";
import "./core/di/container"; 
import authRoutes from "./routes/auth.Routes";
import { userRoutes, userBatchRoutes } from "./modules/user/user.routes";
import attendanceRoutes from "./routes/attendance.Routes";
import feesRoutes from "./routes/fees.Routes";
import teacherRoutes, { teacherAttendanceRoutes, teacherPaymentsRoutes } from "./modules/teacher/teacher.routes";
import adminRoutes from "./routes/admin.Routes";
import adminAuthRoutes from "./routes/adminAuth.Routes";
import centersRoutes from "./routes/centers.Routes";
import centerRoutes from "./routes/center.Routes";
import dashboardRoutes from "./routes/dashboard.Routes";
import { connectDB } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { attachCenterContext } from "./shared/middleware/centerContext.middleware";
import { startSubscriptionExpiryJob } from "./jobs/subscriptionExpiry.job";
import { startAutomationJobs } from "./jobs/automation.jobs";
import { startRetentionJobs } from "./jobs/retention.jobs";
import parentRoutes from "./modules/parent/parent.routes";
import notificationsRoutes from "./routes/notifications.Routes";
import automationSettingsRoutes from "./routes/automationSettings.Routes";
import activityLogRoutes from "./routes/activityLog.Routes";
import paymentRoutes from "./routes/payment.Routes";
import whatsappRoutes from "./routes/whatsapp.Routes";
import reportsRoutes from "./routes/reports.Routes";
import examRoutes from "./modules/exam/exam.routes";
import { initWhatsApp, destroyAllWAClients } from "./services/whatsappAuth.service";
import { startWhatsAppWorker, stopWhatsAppWorker } from "./services/whatsapp.worker";
import "./models/parentLink.model";

dotenv.config({ path: ".env.local" });
dotenv.config();
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  [
    "http://localhost:3000",
    "https://attendly-sage.vercel.app",
    "https://attendly.sharafathabi.cloud",
  ].join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Basic request logger to help debug 502/CORS issues in production.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const origin = req.headers.origin || "-";
    console.log(
      `[request] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms origin=${origin}`
    );
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachCenterContext);
connectDB();
startSubscriptionExpiryJob();
startAutomationJobs();
startRetentionJobs();

// ── WhatsApp Worker (MongoDB Polling) ──────────────────────────────────────
startWhatsAppWorker();
import("./models/center.model").then(({ CenterModel }) => {
  CenterModel.find({ whatsappStatus: "Connected" }).lean().then(centers => {
    centers.forEach(c => {
      initWhatsApp(c._id.toString()).catch((e) =>
        console.error(`[WhatsApp] Startup connection failed for center ${c._id}:`, e)
      );
    });
  }).catch(e => console.error("[WhatsApp] Failed to fetch centers for startup:", e));
});
app.use("/api/auth", authRoutes);
app.use("/api/students", userRoutes);
app.use("/api/batches", userBatchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feesRoutes);

// New unified /api/users, /api/teachers, /api/parents
app.use("/api/users", userRoutes);
app.use("/api/users/batches", userBatchRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/teacher-payments", teacherPaymentsRoutes);
app.use("/api/parents", parentRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/centers", centersRoutes);
app.use("/api/center", centerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/automation", automationSettingsRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api", examRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[error] Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[process] uncaughtException:", err);
});

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
SocketService.init(httpServer);
httpServer.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// ── (A) Resilient Process Trap Hook ─────────────────────────────────────────
// Traps SIGTERM / SIGINT to cleanly destroy all Puppeteer browser instances
// before the process exits. Prevents orphaned chrome processes and corrupt
// LocalAuth session files from partial writes on abrupt termination.

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Process] Received ${signal} — starting graceful shutdown...`);

  // 1. Stop accepting new BullMQ jobs
  try {
    await stopWhatsAppWorker();
  } catch (e) {
    console.warn("[Process] Error stopping WhatsApp worker:", e);
  }

  // 2. Destroy all WhatsApp Puppeteer clients cleanly
  try {
    await destroyAllWAClients();
  } catch (e) {
    console.warn("[Process] Error destroying WhatsApp clients:", e);
  }

  // 3. Close HTTP server (stop accepting new requests)
  httpServer.close(() => {
    console.log("[Process] HTTP server closed.");
    process.exit(0);
  });

  // Force exit after 10s if shutdown hangs
  setTimeout(() => {
    console.error("[Process] Forced exit after 10s shutdown timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
