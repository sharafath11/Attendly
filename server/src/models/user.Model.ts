import mongoose, { Model, Schema } from "mongoose";
import { IUser } from "../types/userTypes";

const userSchema: Schema<IUser> = new Schema({
    name: { type: String },
    username: { type: String, required: true, },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    isVerified: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    phone: { type: String },
    subjects: { type: [String], default: [] },
    salary: { type: Number },
    role: { type: String, enum: ["center_owner", "teacher", "super_admin", "parent"], default: "center_owner", index: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", index: true },
    position: { type: String },
    status: { type: String, enum: ["active", "pending", "disabled"], default: "active" },
    customId: { type: String, trim: true },
    /** Parent-facing display name (optional, for parent role) */
    parentDisplayName: { type: String, trim: true },
    /** Optional contact email for parent role (in addition to login email) */
    parentContactEmail: { type: String, trim: true, lowercase: true },
}, { timestamps: true })

// Enforce unique custom ID per center for non-owners/teachers/parents
userSchema.index(
  { centerId: 1, customId: 1 },
  { unique: true, partialFilterExpression: { customId: { $type: "string" } } }
);

// Enforce one center owner per center.
userSchema.index(
  { centerId: 1, role: 1 },
  { unique: true, partialFilterExpression: { role: "center_owner" } }
);

// Enforce unique teacher usernames within a center.
userSchema.index({ centerId: 1, username: 1 }, { unique: true });


// Faster multi-tenant role queries.
userSchema.index({ centerId: 1, role: 1 });

userSchema.index(
  { centerId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { role: "parent", phone: { $type: "string" } } }
);

export const UserModel :Model<IUser>=mongoose.model<IUser>("User",userSchema)
