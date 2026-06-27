import { Router, Request, Response } from "express";
import { tenantGuard } from "../../shared/middleware/tenant.middleware";
import { requireRole } from "../../shared/middleware/role.middleware";
import { ExamModel } from "../../models/exam.model";
import { MarkModel } from "../../models/mark.model";
import { StudentModel } from "../../models/students.model";
import { CenterModel } from "../../models/center.model";
import { enqueueWhatsAppMessage } from "../../services/whatsappQueue.service";
import mongoose from "mongoose";

const router = Router();

// /api/teacher/exams/submit
router.post(
  "/teacher/exams/submit",
  requireRole(["center_owner", "teacher"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId, userId } = req as any;
      const { batchId, subject, examName, totalMarks, date, marks } = req.body;

      if (!batchId || !subject || !examName || !totalMarks || !date || !Array.isArray(marks)) {
        return res.status(400).json({ ok: false, msg: "Missing required fields or invalid marks payload" });
      }

      // Create Exam
      const exam = await ExamModel.create({
        centerId,
        batchId,
        subject,
        examName,
        totalMarks: Number(totalMarks),
        date: new Date(date),
      });

      // Upsert Marks
      const bulkOps = marks.map((m: any) => ({
        updateOne: {
          filter: { examId: exam._id, studentId: m.studentId },
          update: {
            $set: {
              centerId,
              marksObtained: Number(m.marksObtained),
            },
          },
          upsert: true,
        },
      }));

      await MarkModel.bulkWrite(bulkOps);

      // Fetch Center Name
      const center = await CenterModel.findById(centerId).select("name").lean();
      const centerName = center?.name || "Our Center";

      // Trigger WhatsApp Notifications
      for (const m of marks) {
        const student = await StudentModel.findOne({ _id: m.studentId, centerId }).lean();
        if (student && student.parentPhone) {
          const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
          const message = `Dear ${student.parentName}, Progress Report from ${centerName}. Your child ${student.name} scored ${m.marksObtained} / ${totalMarks} in the recent ${subject} exam ([Exam Name: ${examName}]). (Ref: ${timestamp})`;
          
          await enqueueWhatsAppMessage({
            phone: student.parentPhone,
            message,
            centerId,
          }).catch((err) => console.error("Failed to enqueue exam mark message", err));
        }
      }

      res.status(201).json({ ok: true, msg: "Exam and marks successfully saved", data: exam });
    } catch (error: any) {
      console.error("[SubmitExam] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to submit exam marks" });
    }
  }
);

export default router;
