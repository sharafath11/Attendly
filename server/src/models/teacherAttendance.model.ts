import mongoose, { Document, Model, Schema } from "mongoose";

export type TeacherAttendanceStatus = "present" | "absent" | "half_day";
export type TeacherShift = "morning" | "afternoon" | "evening" | "night";

export interface ITeacherAttendance {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  date: string;
  status: TeacherAttendanceStatus;
  shift?: TeacherShift;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TeacherAttendanceDocument = ITeacherAttendance & Document;

const teacherAttendanceSchema: Schema<TeacherAttendanceDocument> = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    date: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ["present", "absent", "half_day"] },
    shift: { type: String, enum: ["morning", "afternoon", "evening", "night"] },
    checkInTime: { type: String },
    checkOutTime: { type: String },
  },
  { timestamps: true }
);

teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });
teacherAttendanceSchema.index({ centerId: 1, teacherId: 1, date: 1 });

export const TeacherAttendanceModel: Model<TeacherAttendanceDocument> = mongoose.model<TeacherAttendanceDocument>(
  "TeacherAttendance",
  teacherAttendanceSchema
);
