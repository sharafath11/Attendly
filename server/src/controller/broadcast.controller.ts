import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { UserModel } from "../models/user.Model";
import { StudentModel } from "../models/students.model";
import { ParentLinkModel } from "../models/parentLink.model";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { enqueueWhatsAppMessage } from "../services/whatsappQueue.service";
import mongoose from "mongoose";

export class BroadcastController {
  async sendBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const { centerId } = req as AuthenticatedRequest;
      const { targetAudience, batchId, messageTemplate } = req.body;

      if (!targetAudience || !messageTemplate) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing required fields", false);
      }

      let recipients: Array<{ phone: string; name: string; studentName?: string; parentName?: string; teacherName?: string }> = [];

      if (targetAudience === "teachers" || targetAudience === "all") {
        const teachers = await UserModel.find({ centerId, role: "teacher", phone: { $exists: true, $ne: null } }).lean().exec();
        for (const t of teachers) {
          if (t.phone) {
            recipients.push({ phone: t.phone, name: t.name || t.username, teacherName: t.name || t.username });
          }
        }
      }

      if (targetAudience === "parents" || targetAudience === "all" || targetAudience === "batch") {
        let studentsFilter: any = { centerId: new mongoose.Types.ObjectId(centerId), isDeleted: false, parentPhone: { $exists: true, $ne: "" } };
        
        if (targetAudience === "batch") {
          if (!batchId) return sendResponse(res, StatusCode.BAD_REQUEST, "Missing batchId", false);
          studentsFilter.batchId = new mongoose.Types.ObjectId(batchId);
        }

        const students = await StudentModel.find(studentsFilter).lean().exec();
        
        for (const s of students) {
          if (s.parentPhone) {
            recipients.push({
              phone: s.parentPhone,
              name: s.parentName || "Parent",
              parentName: s.parentName || "Parent",
              studentName: s.name,
            });
          }
        }
      }

      // Deduplicate by phone
      const uniqueRecipientsMap = new Map<string, any>();
      for (const r of recipients) {
        // Prefer keeping student info if multiple exist, or just merge
        if (!uniqueRecipientsMap.has(r.phone)) {
          uniqueRecipientsMap.set(r.phone, r);
        } else {
          const existing = uniqueRecipientsMap.get(r.phone);
          if (r.studentName && !existing.studentName) {
            existing.studentName = r.studentName;
          }
        }
      }

      const uniqueRecipients = Array.from(uniqueRecipientsMap.values());

      if (uniqueRecipients.length === 0) {
        return sendResponse(res, StatusCode.NOT_FOUND, "No recipients found with valid phone numbers", false);
      }

      let enqueuedCount = 0;
      for (const recipient of uniqueRecipients) {
        let personalizedMessage = messageTemplate;
        
        // Simple interpolation
        personalizedMessage = personalizedMessage.replace(/\{\{name\}\}/g, recipient.name || "");
        personalizedMessage = personalizedMessage.replace(/\{\{student_name\}\}/g, recipient.studentName || "your child");
        personalizedMessage = personalizedMessage.replace(/\{\{parent_name\}\}/g, recipient.parentName || "Parent");
        personalizedMessage = personalizedMessage.replace(/\{\{teacher_name\}\}/g, recipient.teacherName || "Teacher");

        await enqueueWhatsAppMessage({
          phone: recipient.phone,
          message: personalizedMessage,
          centerId: centerId as string,
        }).catch(console.error);
        
        enqueuedCount++;
      }

      return sendResponse(res, StatusCode.OK, `Broadcast queued for ${enqueuedCount} recipients`, true);
    } catch (err) {
      next(err);
    }
  }
}

export const broadcastController = new BroadcastController();
