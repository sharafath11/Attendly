import mongoose, { Document, Model, Schema } from "mongoose";

export type SubscriptionStatus = "active" | "pending_payment" | "expired" | "blocked";

export interface ICenter {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  medium?: "English" | "Malayalam";
  status?: "pending" | "verified" | "rejected";
  planType?: "basic" | "pro";
  teacherLimit?: number;
  studentLimit?: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  blocked: boolean;
  blockedReason?: string | null;
  blockedAt?: Date | null;
  planName?: string | null;
  monthlyFee?: number | null;
  lastPaymentDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CenterDocument = ICenter & Document;

const centerSchema: Schema<CenterDocument> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address: { type: String },
    medium: { type: String, enum: ["English", "Malayalam"] },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    planType: { type: String, enum: ["basic", "pro"] },
    teacherLimit: { type: Number },
    studentLimit: { type: Number },
    subscriptionStatus: {
      type: String,
      enum: ["active", "pending_payment", "expired", "blocked"],
      default: "pending_payment",
      index: true,
    },

    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    blocked: { type: Boolean, default: false, index: true },
    blockedReason: { type: String },
    blockedAt: { type: Date },
    planName: { type: String },
    monthlyFee: { type: Number },
    lastPaymentDate: { type: Date },
  },
  { timestamps: true }
);

centerSchema.index({ email: 1 }, { unique: true });
centerSchema.index({ subscriptionEndDate: 1 });

export const CenterModel: Model<CenterDocument> = mongoose.model<CenterDocument>("Center", centerSchema);
