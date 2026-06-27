import mongoose, { Document, Schema } from "mongoose";

export interface IInvitation extends Document {
  email: string;
  name: string;
  token: string;
  centerId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const invitationSchema = new Schema<IInvitation>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Automatically delete invitations that expired
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvitationModel = mongoose.model<IInvitation>("Invitation", invitationSchema);
