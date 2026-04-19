import mongoose, { Document, Model, Schema } from "mongoose";

export type PlatformPaymentStatus = "created" | "paid" | "failed";

export interface IPaymentTransaction {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  parentUserId?: mongoose.Types.ObjectId;
  amountPaise: number;
  currency: string;
  status: PlatformPaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  method?: string;
  receipt?: string;
  notes?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentTransactionDocument = IPaymentTransaction & Document;

const paymentTransactionSchema = new Schema<PaymentTransactionDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, sparse: true },
    method: { type: String },
    receipt: { type: String },
    notes: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ centerId: 1, createdAt: -1 });

export const PaymentTransactionModel: Model<PaymentTransactionDocument> = mongoose.model<PaymentTransactionDocument>(
  "PaymentTransaction",
  paymentTransactionSchema
);
