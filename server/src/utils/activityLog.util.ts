import mongoose from "mongoose";
import { ActivityLogModel, ActivityAction } from "../models/activityLog.model";

export async function logActivity(params: {
  centerId: string;
  actorUserId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ActivityLogModel.create({
      centerId: new mongoose.Types.ObjectId(params.centerId),
      actorUserId: new mongoose.Types.ObjectId(params.actorUserId),
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ? new mongoose.Types.ObjectId(params.entityId) : undefined,
      summary: params.summary,
      meta: params.meta,
    });
  } catch (e) {
    console.error("[ActivityLog] failed", e);
  }
}
