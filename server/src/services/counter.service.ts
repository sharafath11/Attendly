import { CounterModel } from "../models/counter.model";
import mongoose from "mongoose";

/**
 * Generates the next custom ID for a given center and model.
 * Uses atomic findOneAndUpdate to prevent race conditions in concurrent settings.
 */
export async function generateNextCustomId(
  centerId: string | mongoose.Types.ObjectId,
  modelName: "student" | "teacher" | "parent"
): Promise<string> {
  const centerObjectId = new mongoose.Types.ObjectId(centerId.toString());

  const counter = await CounterModel.findOneAndUpdate(
    { centerId: centerObjectId, modelName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  const seqStr = String(counter.seq).padStart(5, "0");

  if (modelName === "student") {
    return `STU-${seqStr}`;
  } else if (modelName === "teacher") {
    return `TCH-${seqStr}`;
  } else {
    return `PAR-${seqStr}`;
  }
}
