import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { StudentRemarkModel } from "../models/studentRemark.model";
import { StudentModel } from "../models/students.model";
import { CenterModel } from "../models/center.model";
import { UserModel } from "../models/user.Model";
import { ParentLinkModel } from "../models/parentLink.model";
import { ParentNotificationModel } from "../models/parentNotification.model";
import { sendTemplateMessage } from "../services/whatsapp.service";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { normalizePhoneDigits } from "../utils/phone.util";

export const PREDEFINED_REMARKS = [
  "Incomplete Homework",
  "Low Test Marks",
  "Inattentive in Class",
  "Excellent Performance",
  "Good Participation"
];

/**
 * Decoupled background sender for academic remarks
 */
async function sendRemarkNotificationAsync(
  centerId: string,
  studentId: string,
  teacherUserId: string,
  remarkText: string
): Promise<void> {
  const centerObjectId = new mongoose.Types.ObjectId(centerId);

  // 1. Fetch Student & Center details with strict tenant context
  const student = await StudentModel.findOne({
    _id: studentId,
    centerId: centerObjectId,
    isDeleted: false,
  })
    .lean()
    .exec();
  if (!student) return;

  const center = await CenterModel.findById(centerId).lean().exec();
  const centerName = center?.name ?? "Center";

  // 2. Fetch linked Parent phone
  const phoneDigits = student.parentPhone ? normalizePhoneDigits(student.parentPhone) : "";
  if (!phoneDigits) return;

  // 3. Resolve parent details with strict tenant context
  const parentUser = await UserModel.findOne({
    role: "parent",
    centerId: centerObjectId,
    phone: phoneDigits,
  })
    .lean()
    .exec();

  const parentName = parentUser?.name || "Parent";
  const parentUserId = parentUser?._id;

  const now = new Date();
  const timestamp = now.toTimeString().split(" ")[0]; // HH:MM:SS

  // 4. Format strict anti-spam localized remark message
  const msg = `Dear ${parentName},\nNotification from ${centerName}. Teacher academic remark for your child ${student.name}: "${remarkText}".\n\n(Ref: ${timestamp})`;

  // 5. Persist into ParentNotification collection for Inbox display
  let parentNotificationId: string | undefined = undefined;
  if (parentUserId) {
    const parentNotif = await ParentNotificationModel.create({
      parentUserId,
      studentId: student._id,
      centerId: new mongoose.Types.ObjectId(centerId),
      title: "Academic Remark",
      message: msg,
      status: "queued",
    });
    parentNotificationId = (parentNotif as any)._id.toString();
  }

  // 6. Queue WhatsApp message via BullMQ
  await sendTemplateMessage(
    "academic_remark",
    {
      "1": student.name,
      "2": remarkText,
      "3": centerName,
      body: msg,
    },
    phoneDigits,
    centerId,
    undefined,
    parentNotificationId
  );
}

export class RemarksController {
  /**
   * Returns list of predefined academic remarks
   */
  async getPredefined(req: Request, res: Response) {
    return sendResponse(res, StatusCode.OK, "Predefined remarks fetched successfully", true, PREDEFINED_REMARKS);
  }

  /**
   * Submits a student remark. Responds immediately before triggering notifications asynchronously.
   */
  async submitRemark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { studentId, remarkType, remarkText } = req.body;
      const centerId = req.centerId;
      const teacherUserId = req.authUserId;

      if (!studentId || !remarkType || !remarkText || !centerId || !teacherUserId) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing required parameters", false);
      }

      // Check standard remarks validation
      if (remarkType === "standard" && !PREDEFINED_REMARKS.includes(remarkText)) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Invalid predefined remark string", false);
      }

      // Save remark to Database
      await StudentRemarkModel.create({
        centerId: new mongoose.Types.ObjectId(centerId),
        teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
        studentId: new mongoose.Types.ObjectId(studentId),
        remarkType,
        remarkText,
      });

      // DECUPLED/ASYNCHRONOUS background process
      sendRemarkNotificationAsync(centerId, studentId, teacherUserId, remarkText).catch((err) => {
        console.error("[Remarks] Decoupled WhatsApp notification trigger failed:", err);
      });

      // Respond immediately to UI
      return sendResponse(
        res,
        StatusCode.CREATED,
        "Remark submitted successfully. Notification queued in background.",
        true
      );
    } catch (err) {
      next(err);
    }
  }
}
