import "reflect-metadata";
import express from "express";
import "./core/di/container"; 
import authRoutes from "./routes/auth.Routes";
import studentRoutes from "./routes/students.Routes";
import batchRoutes from "./routes/batches.Routes";
import attendanceRoutes from "./routes/attendance.Routes";
import feesRoutes from "./routes/fees.Routes";
import teacherRoutes from "./routes/teacher.Routes";
import teacherPaymentsRoutes from "./routes/teacherPayments.Routes";
import teacherAttendanceRoutes from "./routes/teacherAttendance.Routes";
import adminRoutes from "./routes/admin.Routes";
import adminAuthRoutes from "./routes/adminAuth.Routes";
import centersRoutes from "./routes/centers.Routes";
import dashboardRoutes from "./routes/dashboard.Routes";
import { connectDB } from "./config/database";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { attachCenterContext } from "./shared/middleware/centerContext.middleware";
import { startSubscriptionExpiryJob } from "./jobs/subscriptionExpiry.job";

dotenv.config();
const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://attendly-sage.vercel.app",
      "https://attendly.sharafathabi.cloud",
    ],
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
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/teacher-payments", teacherPaymentsRoutes);
app.use("/api/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/centers", centersRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global error handler (last middleware)
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
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
