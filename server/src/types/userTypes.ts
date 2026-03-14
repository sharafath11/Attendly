import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;  
  username: string;
  name?: string;
  email: string;
  isVerified: boolean;
  password: string;
  authProvider?: "local" | "google";
  phone?: string;
  subjects?: string[];
  salary?: number;
  role?: "center_owner" | "teacher" | "super_admin";
  centerId?: Types.ObjectId | string;
  position?: string;
  status?: "active" | "pending" | "disabled";
  createdAt?: Date;
  updatedAt?: Date;
}
