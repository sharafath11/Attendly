import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  parentPhone?: string;
  batchId: mongoose.Types.ObjectId;
  monthlyFee: number;
  joinDate: Date;
  userId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentDocument = IStudent & Document;

const studentSchema: Schema<StudentDocument> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    parentPhone: { type: String, trim: true },
    batchId: { type: Schema.Types.ObjectId, required: true, ref: "Batch" },
    monthlyFee: { type: Number, required: true },
    joinDate: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentSchema.index({ userId: 1 });
studentSchema.index({ batchId: 1 });

export const StudentModel: Model<StudentDocument> = mongoose.model<StudentDocument>("Student", studentSchema);
