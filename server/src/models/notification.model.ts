import mongoose, { Document, Model, Schema } from "mongoose";

export type NotificationType =
  | "fee_reminder"
  | "attendance_alert"
  | "payment_confirmation"
  | "combined_alert"
  | "broadcast"
  | "otp"
  | "system";
export type NotificationChannel = "whatsapp" | "email" | "sms";
export type NotificationStatus = "queued" | "sent" | "failed";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  /** Staff user who triggered (optional for system jobs) */
  userId?: mongoose.Types.ObjectId;
  /** Parent recipient when applicable */
  parentUserId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  message: string;
  error?: string;
  providerMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = INotification & Document;

const notificationSchema = new Schema<NotificationDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    type: {
      type: String,
      enum: [
        "fee_reminder",
        "attendance_alert",
        "payment_confirmation",
        "combined_alert",
        "broadcast",
        "otp",
        "system",
      ],
      required: true,
      index: true,
    },
    channel: { type: String, enum: ["whatsapp", "email", "sms"], required: true },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued", index: true },
    message: { type: String, required: true },
    error: { type: String },
    providerMessageId: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ centerId: 1, parentUserId: 1, createdAt: -1 });
notificationSchema.index({ centerId: 1, createdAt: -1 });

// TTL index to automatically prune notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const NotificationModel: Model<NotificationDocument> = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema
);
