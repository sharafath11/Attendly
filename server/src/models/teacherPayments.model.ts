import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITeacherPayment {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  amount: number;
  month: string;
  year: number;
  notes?: string;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherPaymentDocument = ITeacherPayment & Document;

const teacherPaymentSchema: Schema<TeacherPaymentDocument> = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    notes: { type: String, trim: true },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

teacherPaymentSchema.index({ teacherId: 1, month: 1, year: 1 }, { unique: true });
teacherPaymentSchema.index({ centerId: 1, teacherId: 1, month: 1, year: 1 });

export const TeacherPaymentModel: Model<TeacherPaymentDocument> = mongoose.model<TeacherPaymentDocument>(
  "TeacherPayment",
  teacherPaymentSchema
);
