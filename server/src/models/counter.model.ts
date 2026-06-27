import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICounter {
  centerId: mongoose.Types.ObjectId;
  modelName: "student" | "teacher" | "parent";
  seq: number;
}

export type CounterDocument = ICounter & Document;

const counterSchema = new Schema<CounterDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
    modelName: { type: String, required: true, enum: ["student", "teacher", "parent"] },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index to guarantee one counter per center + model combination
counterSchema.index({ centerId: 1, modelName: 1 }, { unique: true });

export const CounterModel: Model<CounterDocument> = mongoose.model<CounterDocument>(
  "Counter",
  counterSchema
);
