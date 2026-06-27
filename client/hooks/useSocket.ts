import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export function useSocket(
  onNotificationReceived: (notification: {
    _id: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
  }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Establish connection with credentials (cookies)
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to server:", socket.id);
    });

    // General user notifications from database fallback triggers
    socket.on("attendance_marked", (data) => {
      console.log("[Socket] Attendance marked event:", data);
      onNotificationReceived({
        _id: data._id || `temp-${Date.now()}`,
        title: data.title || "Attendance Marked",
        message: data.message || `Attendance processed successfully.`,
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
      });
    });

    socket.on("fee_reminder_triggered", (data) => {
      console.log("[Socket] Fee reminder triggered event:", data);
      onNotificationReceived({
        _id: data._id || `temp-${Date.now()}`,
        title: data.title || "Fee Reminder",
        message: data.message || `Fee reminder sent successfully.`,
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
      });
    });

    socket.on("monthly_report_generated", (data) => {
      console.log("[Socket] Monthly report generated event:", data);
      onNotificationReceived({
        _id: data._id || `temp-${Date.now()}`,
        title: data.title || "Monthly Report Generated",
        message: data.message || `Monthly report has been generated.`,
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
      });
    });

    socket.on("teacher_joined", (data) => {
      console.log("[Socket] Teacher joined event:", data);
      onNotificationReceived({
        _id: data._id || `temp-${Date.now()}`,
        title: data.title || "Teacher Onboarded",
        message: data.message || `A new teacher has joined your center.`,
        createdAt: data.createdAt || new Date().toISOString(),
        isRead: false,
      });
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection handshake error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [onNotificationReceived]);

  return socketRef.current;
}
