import mongoose, { Document, Model, Schema } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "leave";

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  markedBy: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceDocument = IAttendance & Document;

const attendanceSchema: Schema<AttendanceDocument> = new Schema(
  {
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    markedBy: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    batchId: { type: Schema.Types.ObjectId, required: true, ref: "Batch", index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: "Student", index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: ["present", "absent", "leave"] },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ centerId: 1, batchId: 1, date: 1 });
attendanceSchema.index({ centerId: 1, studentId: 1, date: 1 });
attendanceSchema.index({ markedBy: 1, batchId: 1, date: 1 });
attendanceSchema.index({ markedBy: 1, studentId: 1, date: 1 });

export const AttendanceModel: Model<AttendanceDocument> = mongoose.model<AttendanceDocument>(
  "Attendance",
  attendanceSchema
);
