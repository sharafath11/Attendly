import mongoose, { Document, Model, Schema } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "leave" | "half_day";

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  markedBy: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  subject?: string;
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
    subject: { type: String, required: false, trim: true },
    status: { type: String, required: true, enum: ["present", "absent", "leave", "half_day"] },
  },
  { timestamps: true }
);

// Now uniqueness is per student+date+subject (to allow multiple subjects per day)
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ centerId: 1, batchId: 1, date: 1, subject: 1 });
attendanceSchema.index({ centerId: 1, studentId: 1, date: 1 });
attendanceSchema.index({ markedBy: 1, batchId: 1, date: 1 });
attendanceSchema.index({ markedBy: 1, studentId: 1, date: 1 });

export const AttendanceModel: Model<AttendanceDocument> = mongoose.model<AttendanceDocument>(
  "Attendance",
  attendanceSchema
);
