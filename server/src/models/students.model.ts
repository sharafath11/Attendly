import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  batchId: mongoose.Types.ObjectId;
  monthlyFee: number;
  joinDate: Date;
  centerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  customId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StudentDocument = IStudent & Document;

const studentSchema: Schema<StudentDocument> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    batchId: { type: Schema.Types.ObjectId, required: true, ref: "Batch" },
    monthlyFee: { type: Number, required: true },
    joinDate: { type: Date, required: true },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    customId: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentSchema.index({ centerId: 1 });
studentSchema.index(
  { centerId: 1, customId: 1 },
  { unique: true, partialFilterExpression: { customId: { $type: "string" } } }
);
studentSchema.index({ centerId: 1, parentPhone: 1 });
export const StudentModel: Model<StudentDocument> = mongoose.model<StudentDocument>("Student", studentSchema);
