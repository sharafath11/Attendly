import mongoose, { Document, Model, Schema } from "mongoose";

export type FeeStatus = "Paid" | "Pending" | "Overdue";
export type PaymentMethod = "Cash" | "UPI" | "Bank";

export interface IFee {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;
  status: FeeStatus;
  paymentMethod?: PaymentMethod;
  paidDate?: Date;
  markedBy?: mongoose.Types.ObjectId;
  editedBy?: mongoose.Types.ObjectId;
  changeNote?: string;
  editHistory: {
    editedBy: mongoose.Types.ObjectId;
    previousStatus: FeeStatus;
    newStatus: FeeStatus;
    note?: string;
    editedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export type FeeDocument = IFee & Document;

const feeSchema: Schema<FeeDocument> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, ref: "Student", index: true },
    batchId: { type: Schema.Types.ObjectId, required: true, ref: "Batch", index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, enum: ["Paid", "Pending", "Overdue"], default: "Pending" },
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Bank"] },
    paidDate: { type: Date },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
    editedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changeNote: { type: String, trim: true },
    editHistory: {
      type: [
      {
        editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        previousStatus: { type: String, enum: ["Paid", "Pending", "Overdue"], required: true },
        newStatus: { type: String, enum: ["Paid", "Pending", "Overdue"], required: true },
        note: { type: String, trim: true },
        editedAt: { type: Date, required: true },
      },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

feeSchema.index({ userId: 1, month: 1, year: 1 });
feeSchema.index({ userId: 1, batchId: 1, month: 1, year: 1 });
feeSchema.index({ userId: 1, studentId: 1, month: 1, year: 1 }, { unique: true });

export const FeeModel: Model<FeeDocument> = mongoose.model<FeeDocument>("Fee", feeSchema);
