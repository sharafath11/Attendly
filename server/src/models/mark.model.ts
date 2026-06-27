import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMark {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marksObtained: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MarkDocument = IMark & Document;

const markSchema = new Schema<MarkDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    examId: { type: Schema.Types.ObjectId, required: true, ref: "Exam" },
    studentId: { type: Schema.Types.ObjectId, required: true, ref: "Student" },
    marksObtained: { type: Number, required: true },
  },
  { timestamps: true }
);

// Enforce compound unique index to prevent duplicate score entry bugs
markSchema.index({ examId: 1, studentId: 1 }, { unique: true });
// Ensure compound index for instant rendering (Highest to Lowest)
markSchema.index({ centerId: 1, examId: 1, marksObtained: -1 });

export const MarkModel: Model<MarkDocument> = mongoose.models.Mark || mongoose.model<MarkDocument>("Mark", markSchema);
