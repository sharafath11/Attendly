import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUserNotification extends Document {
  userId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });

export const UserNotificationModel: Model<IUserNotification> = mongoose.model<IUserNotification>(
  "UserNotification",
  userNotificationSchema
);
