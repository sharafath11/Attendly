import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAutomationSettings {
  _id: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  autoFeeGeneration: boolean;
  feeReminderEnabled: boolean;
  /** Days before due date to send WhatsApp reminder */
  reminderDaysBefore: number;
  /** If true, end-of-day job marks absent when no attendance row exists */
  attendanceAutoDefaultAbsent: boolean;
  updatedAt: Date;
  createdAt: Date;
}

export type AutomationSettingsDocument = IAutomationSettings & Document;

const automationSettingsSchema = new Schema<AutomationSettingsDocument>(
  {
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, unique: true, index: true },
    autoFeeGeneration: { type: Boolean, default: false },
    feeReminderEnabled: { type: Boolean, default: false },
    reminderDaysBefore: { type: Number, default: 3, min: 0, max: 30 },
    attendanceAutoDefaultAbsent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AutomationSettingsModel: Model<AutomationSettingsDocument> = mongoose.model<AutomationSettingsDocument>(
  "AutomationSettings",
  automationSettingsSchema
);
