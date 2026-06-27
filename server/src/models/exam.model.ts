import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExam {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  subject: string;
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
    subject: { type: String, required: true },
    examName: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export const ExamModel: Model<ExamDocument> = mongoose.models.Exam || mongoose.model<ExamDocument>("Exam", examSchema);
