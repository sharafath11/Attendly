import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOtpSession extends Document {
  phone: string;
  otp: string;
  centerId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const otpSessionSchema = new Schema<IOtpSession>(
  {
    phone: { type: String, required: true, trim: true },
    otp: { type: String, required: true },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired OTPs
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpSessionModel: Model<IOtpSession> = mongoose.model<IOtpSession>("OtpSession", otpSessionSchema);
