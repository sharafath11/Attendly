import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { verifyAccessToken } from "../lib/jwtToken";
import { UserNotificationModel } from "../models/userNotification.model";

export class SocketService {
  private static io: Server | null = null;

  static init(server: HttpServer) {
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

    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    this.io.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1] ||
          this.parseCookie(socket.handshake.headers?.cookie || "", "token");

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
          return next(new Error("Authentication error: Invalid token"));
        }

        socket.data = {
          userId: decoded.id || decoded.userId,
          role: decoded.role,
          centerId: decoded.centerId,
        };

        next();
      } catch (err) {
        next(new Error("Authentication error: Failed to decode token"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const { userId, centerId } = socket.data;

      if (userId) {
        socket.join(userId.toString());
      }
      if (centerId) {
        socket.join(centerId.toString());
      }

      console.log(`[Socket] User connected: ${userId} (Center: ${centerId})`);

      socket.on("disconnect", () => {
        console.log(`[Socket] User disconnected: ${userId}`);
      });
    });
  }

  static sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.warn("[SocketService] Socket.io is not initialized.");
      return;
    }
    this.io.to(userId.toString()).emit(event, data);
  }

  static sendToCenter(centerId: string, event: string, data: any) {
    if (!this.io) {
      console.warn("[SocketService] Socket.io is not initialized.");
      return;
    }
    this.io.to(centerId.toString()).emit(event, data);
  }

  static async createAndSendNotification(
    centerId: string,
    userId: string,
    title: string,
    message: string,
    event: string,
    data: any = {}
  ) {
    try {
      // 1. Persist in database
      const notification = await UserNotificationModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        centerId: new mongoose.Types.ObjectId(centerId),
        title,
        message,
        isRead: false,
      });

      // 2. Emit real-time event via Socket.io
      this.sendToUser(userId, event, {
        ...data,
        _id: (notification as any)._id.toString(),
        title,
        message,
        isRead: false,
        createdAt: (notification as any).createdAt,
      });

      console.log(`[SocketService] User notification created & pushed to ${userId}: ${title}`);
    } catch (err) {
      console.error("[SocketService] Failed to create and send notification:", err);
    }
  }

  private static parseCookie(cookieStr: string, key: string): string | null {
    if (!cookieStr) return null;
    const match = cookieStr.match(new RegExp(`(^|;)\\s*${key}\\s*=\\s*([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  }
}
