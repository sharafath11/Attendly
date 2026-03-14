import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "../types/userTypes";

const userSchema: Schema<IUser> = new Schema({
    name: { type: String },
    username: { type: String, required: true, },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    phone: { type: String },
    subjects: { type: [String], default: [] },
    salary: { type: Number },
    role: { type: String, enum: ["center_owner", "teacher", "super_admin"], default: "center_owner", index: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", index: true },
    position: { type: String },
    status: { type: String, enum: ["active", "pending", "disabled"], default: "active" },
}, { timestamps: true })

// Enforce one center owner per center.
userSchema.index(
  { centerId: 1, role: 1 },
  { unique: true, partialFilterExpression: { role: "center_owner" } }
);

// Enforce unique teacher usernames within a center.
userSchema.index({ centerId: 1, username: 1 }, { unique: true });

// Faster multi-tenant role queries.
userSchema.index({ centerId: 1, role: 1 });

export const UserModel :Model<IUser>=mongoose.model<IUser>("User",userSchema)
