import { Router, Request, Response } from "express";
import { tenantGuard } from "../../shared/middleware/tenant.middleware";
import { requireRole } from "../../shared/middleware/role.middleware";
import { ExamModel } from "../../models/exam.model";
import { MarkModel } from "../../models/mark.model";
import { StudentModel } from "../../models/students.model";
import { CenterModel } from "../../models/center.model";
import { UserModel } from "../../models/user.Model";
import { enqueueWhatsAppMessage } from "../../services/whatsappQueue.service";
import mongoose from "mongoose";

const router = Router();

// /api/teacher/exams/create
router.post(
  "/teacher/exams/create",
  requireRole(["center_owner"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId } = req as any;
      const { batchId, subject, examName, totalMarks, date, teacherId } = req.body;

      if (!batchId || !subject || !examName || !totalMarks || !date || !teacherId) {
        return res.status(400).json({ ok: false, msg: "Missing required fields" });
      }

      // Create Exam
      const exam = await ExamModel.create({
        centerId,
        batchId,
        teacherId,
        subject,
        examName,
        totalMarks: Number(totalMarks),
        date: new Date(date),
      });

      // Fetch Center Name
      const center = await CenterModel.findById(centerId).select("name").lean();
      const centerName = center?.name || "Our Center";
      const examDateStr = new Date(date).toLocaleDateString();

      // Trigger WhatsApp Notifications for Exam Scheduled
      const students = await StudentModel.find({ batchId, centerId, isDeleted: false }).lean();
      for (const student of students) {
        if (student.parentPhone) {
          const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
          const message = `Dear ${student.parentName}, New Exam Alert from ${centerName}. A ${subject} exam [${examName}] has been scheduled for your child ${student.name} on ${examDateStr}. Total Marks: ${totalMarks}. Please ensure your child prepares well. (Ref: ${timestamp})`;
          
          await enqueueWhatsAppMessage({
            phone: student.parentPhone,
            message,
            centerId,
          }).catch((err) => console.error("Failed to enqueue exam creation message", err));
        }
      }

      // Trigger WhatsApp Notification for the Assigned Teacher
      if (teacherId) {
        const teacher = await UserModel.findById(teacherId).lean();
        if (teacher && teacher.phone) {
          const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
          const teacherMessage = `Hello ${teacher.name}, an exam has been assigned to you by ${centerName}.\n\nSubject: ${subject}\nExam: ${examName}\nTotal Marks: ${totalMarks}\nDate: ${examDateStr}\n\nPlease ensure you upload the marks after the exam. (Ref: ${timestamp})`;
          
          await enqueueWhatsAppMessage({
            phone: teacher.phone,
            message: teacherMessage,
            centerId,
          }).catch((err) => console.error("Failed to enqueue teacher exam message", err));
        }
      }

      res.status(201).json({ ok: true, msg: "Exam scheduled successfully", data: exam });
    } catch (error: any) {
      console.error("[CreateExam] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to schedule exam" });
    }
  }
);

// /api/teacher/exams/submit-scores
router.post(
  "/teacher/exams/submit-scores",
  requireRole(["center_owner", "teacher"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId } = req as any;
      const { examId, marks } = req.body;

      if (!examId || !Array.isArray(marks)) {
        return res.status(400).json({ ok: false, msg: "Missing examId or marks payload" });
      }

      const exam = await ExamModel.findOne({ _id: examId, centerId }).lean();
      if (!exam) {
        return res.status(404).json({ ok: false, msg: "Exam not found" });
      }

      const { role, authUserId } = req as any;
      if (role === "teacher" && exam.teacherId.toString() !== authUserId.toString()) {
        return res.status(403).json({ ok: false, msg: "You are not authorized to add marks for this exam" });
      }

      // Validation: marksObtained <= totalMarks
      for (const m of marks) {
        if (Number(m.marksObtained) > Number(exam.totalMarks)) {
          return res.status(400).json({ ok: false, msg: `Marks obtained (${m.marksObtained}) cannot be greater than Total Marks (${exam.totalMarks})` });
        }
      }

      // Upsert Marks
      const bulkOps = marks.map((m: any) => ({
        updateOne: {
          filter: { examId: exam._id, studentId: m.studentId },
          update: {
            $set: {
              centerId,
              marksObtained: Number(m.marksObtained),
              ...(m.grade && { grade: m.grade }),
            },
          },
          upsert: true,
        },
      }));

      await MarkModel.bulkWrite(bulkOps);

      // Fetch Center Name
      const center = await CenterModel.findById(centerId).select("name").lean();
      const centerName = center?.name || "Our Center";
      const examDateStr = new Date(exam.date).toLocaleDateString();

      // Trigger WhatsApp Notifications for Marks Upload
      for (const m of marks) {
        const student = await StudentModel.findOne({ _id: m.studentId, centerId }).lean();
        if (student && student.parentPhone) {
          const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
          const message = `Dear ${student.parentName}, Progress Report from ${centerName}. Your child ${student.name} scored ${m.marksObtained} / ${exam.totalMarks} in the recent ${exam.subject} exam (${exam.examName}) held on ${examDateStr}. (Ref: ${timestamp})`;
          
          await enqueueWhatsAppMessage({
            phone: student.parentPhone,
            message,
            centerId,
          }).catch((err) => console.error("Failed to enqueue exam mark message", err));
        }
      }

      res.status(201).json({ ok: true, msg: "Scores successfully saved and parents notified" });
    } catch (error: any) {
      console.error("[SubmitScores] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to submit scores" });
    }
  }
);

// /api/teacher/exams (List all exams for the center, optionally filtered by batchId)
router.get(
  "/teacher/exams",
  requireRole(["center_owner", "teacher"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId, role, userId } = req as any;
      const { batchId, subject } = req.query;

      const query: any = { centerId };
      if (batchId) query.batchId = batchId;
      if (subject) query.subject = subject;

      const exams = await ExamModel.find(query)
        .populate("teacherId", "name")
        .sort({ date: -1 })
        .lean();
      res.status(200).json({ ok: true, data: exams });
    } catch (error: any) {
      console.error("[GetExams] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to get exams" });
    }
  }
);

// /api/teacher/exams/:examId/marks (List all marks for a specific exam)
router.get(
  "/teacher/exams/:examId/marks",
  requireRole(["center_owner", "teacher"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId } = req as any;
      const { examId } = req.params;

      const marks = await MarkModel.find({ centerId, examId })
        .populate("studentId", "name phone parentName parentPhone")
        .sort({ marksObtained: -1 }) // default sort by marks descending
        .lean();

      res.status(200).json({ ok: true, data: marks });
    } catch (error: any) {
      console.error("[GetMarks] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to get marks" });
    }
  }
);

// /api/teacher/students/:studentId/marks (List all marks for a specific student)
router.get(
  "/teacher/students/:studentId/marks",
  requireRole(["center_owner", "teacher"]),
  tenantGuard,
  async (req: Request, res: Response) => {
    try {
      const { centerId } = req as any;
      const { studentId } = req.params;

      const marks = await MarkModel.find({ centerId, studentId })
        .populate("examId", "subject examName totalMarks date")
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({ ok: true, data: marks });
    } catch (error: any) {
      console.error("[GetStudentMarks] Error:", error);
      res.status(500).json({ ok: false, msg: "Failed to get student marks" });
    }
  }
);

export default router;
