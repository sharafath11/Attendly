import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBatch {
  _id: mongoose.Types.ObjectId;
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  centerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type BatchDocument = IBatch & Document;

const batchSchema: Schema<BatchDocument> = new Schema(
  {
    batchName: { type: String, required: true, trim: true },
    classLevel: { type: String, required: true, trim: true },
    medium: { type: String, required: true, trim: true },
    session: { type: String, required: true, trim: true },
    scheduleTime: { type: String, required: true, trim: true },
    days: { type: [String], required: true, default: [] },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  },
  { timestamps: true }
);


export const BatchModel: Model<BatchDocument> = mongoose.model<BatchDocument>("Batch", batchSchema);
