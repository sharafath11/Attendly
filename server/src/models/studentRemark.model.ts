import mongoose, { Document, Schema, Model } from "mongoose";

export interface IStudentRemark extends Document {
  centerId: mongoose.Types.ObjectId;
  teacherUserId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  remarkType: "standard" | "custom";
  remarkText: string;
  createdAt: Date;
}

const studentRemarkSchema = new Schema<IStudentRemark>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    teacherUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    remarkType: { type: String, enum: ["standard", "custom"], required: true },
    remarkText: { type: String, required: true },
  },
  { timestamps: true }
);

export const StudentRemarkModel: Model<IStudentRemark> = mongoose.model<IStudentRemark>(
  "StudentRemark",
  studentRemarkSchema
);
