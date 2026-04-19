import mongoose, { Document, Model, Schema } from "mongoose";

/** Links a parent User to a Student (many-to-many ready). */
export interface IParentLink {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  parentUserId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  relation?: string;
  createdAt: Date;
}

export type ParentLinkDocument = IParentLink & Document;

const parentLinkSchema = new Schema<ParentLinkDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    relation: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

parentLinkSchema.index({ parentUserId: 1, studentId: 1 }, { unique: true });

export const ParentLinkModel: Model<ParentLinkDocument> = mongoose.model<ParentLinkDocument>(
  "ParentLink",
  parentLinkSchema
);
