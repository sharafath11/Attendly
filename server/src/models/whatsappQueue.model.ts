import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWhatsappQueue extends Document {
  phone: string;
  message: string;
  centerId: mongoose.Types.ObjectId;
  notificationId?: mongoose.Types.ObjectId;
  parentNotificationId?: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "failed";
  error?: string;
  attempts: number;
  nextAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const whatsappQueueSchema = new Schema<IWhatsappQueue>(
  {
    phone: { type: String, required: true },
    message: { type: String, required: true },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center" },
    notificationId: { type: Schema.Types.ObjectId, ref: "Notification" },
    parentNotificationId: { type: Schema.Types.ObjectId, ref: "ParentNotification" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    error: { type: String },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

whatsappQueueSchema.index({ status: 1, nextAttemptAt: 1, centerId: 1 });

export const WhatsappQueueModel: Model<IWhatsappQueue> = mongoose.model<IWhatsappQueue>("WhatsappQueue", whatsappQueueSchema);
