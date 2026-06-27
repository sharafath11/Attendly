import mongoose, { Document, Schema, Model } from "mongoose";

export interface IParentNotification extends Document {
  parentUserId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  status: "queued" | "sent" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const parentNotificationSchema = new Schema<IParentNotification>(
  {
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued", index: true },
  },
  { timestamps: true }
);

// TTL index to automatically prune notifications older than 90 days
parentNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const ParentNotificationModel: Model<IParentNotification> = mongoose.model<IParentNotification>(
  "ParentNotification",
  parentNotificationSchema
);
