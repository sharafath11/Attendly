import mongoose, { Document, Model, Schema } from "mongoose";

export type ActivityAction =
  | "student_created"
  | "student_updated"
  | "student_deleted"
  | "fee_marked_paid"
  | "fee_status_updated"
  | "attendance_saved"
  | "batch_created"
  | "teacher_created";

export interface IActivityLog {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: ActivityAction;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  summary: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityLogDocument = IActivityLog & Document;

const activityLogSchema = new Schema<ActivityLogDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    summary: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ centerId: 1, createdAt: -1 });

export const ActivityLogModel: Model<ActivityLogDocument> = mongoose.model<ActivityLogDocument>(
  "ActivityLog",
  activityLogSchema
);
