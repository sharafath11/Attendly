import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExam {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  examName: string;
  totalMarks: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ExamDocument = IExam & Document;

const examSchema = new Schema<ExamDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, required: true, ref: "Center", index: true },
    batchId: { type: Schema.Types.ObjectId, required: true, ref: "Batch" },
    teacherId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    subject: { type: String, required: true },
    examName: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export const ExamModel: Model<ExamDocument> = mongoose.models.Exam || mongoose.model<ExamDocument>("Exam", examSchema);
