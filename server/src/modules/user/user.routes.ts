import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../../core/types";
import { IStudentsController } from "../../core/interfaces/controllers/IStudentsController";
import { IBatchesController } from "../../core/interfaces/controllers/IBatchesController";
import { requireRole } from "../../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../../shared/middleware/subscription.middleware";
import { tenantGuard } from "../../shared/middleware/tenant.middleware";
import { StudentModel } from "../../models/students.model";
import { BatchModel } from "../../models/batches.model";
import { ExamModel } from "../../models/exam.model";
import { MarkModel } from "../../models/mark.model";
import { ParentNotificationModel } from "../../models/parentNotification.model";
import { UserModel } from "../../models/user.Model";
import { ParentLinkModel } from "../../models/parentLink.model";
import mongoose from "mongoose";

const router = express.Router();

router.use(tenantGuard);

const userController = container.resolve<IStudentsController>(TYPES.IStudentsController) as any;

// === Student Routes (mounted at /api/users) ===
router.post(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.createStudent.bind(userController)
);
router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  userController.getStudents.bind(userController)
);
router.get(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  userController.getStudentById.bind(userController)
);
router.put(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.updateStudent.bind(userController)
);
router.delete(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.deleteStudent.bind(userController)
);

// Unified Student 360 Profile View
router.get(
  "/profile/360/:studentId",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  async (req, res) => {
    try {
      const { centerId, userId, role } = req as any;
      const studentId = req.params.studentId;

      if (!mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({ ok: false, msg: "Invalid student ID" });
      }

      // TAB 1: Core Profile Info
      const student = await StudentModel.findOne({ _id: studentId, centerId }).lean();
      if (!student) {
        return res.status(404).json({ ok: false, msg: "Student not found" });
      }

      // TAB 2: Assigned Teachers Layer
      const batch = await BatchModel.findOne({ _id: student.batchId, centerId }).lean();
      let teachers: any[] = [];
      if (batch && batch.userId) {
        teachers = await UserModel.find({ _id: batch.userId, centerId, role: "teacher" })
          .select("name customId")
          .lean();
      }

      // Teacher role authorization check
      if (role === "teacher" && (!batch || !batch.userId || batch.userId.toString() !== userId.toString())) {
         return res.status(403).json({ ok: false, msg: "Access Denied: You do not teach this student" });
      }

      // TAB 3: Academic Leaderboard List
      // Fetch all marks for this student
      const studentMarks = await MarkModel.find({ studentId, centerId }).lean();
      const examIds = studentMarks.map((m) => m.examId);
      
      const exams = await ExamModel.find({ _id: { $in: examIds }, centerId }).lean();
      const leaderboard = await Promise.all(
        exams.map(async (exam) => {
          // Fetch all marks for this exam to sort
          const allExamMarks = await MarkModel.find({ examId: exam._id, centerId })
            .sort({ marksObtained: -1 })
            .lean();
          
          const studentMark = allExamMarks.find((m) => m.studentId.toString() === studentId);
          const rank = allExamMarks.findIndex((m) => m.studentId.toString() === studentId) + 1;

          return {
            examName: exam.examName,
            subject: exam.subject,
            date: exam.date,
            totalMarks: exam.totalMarks,
            marksObtained: studentMark?.marksObtained || 0,
            rank,
            totalStudents: allExamMarks.length,
            batchId: exam.batchId
          };
        })
      );

      // TAB 4: Communication Audit Inbox
      let parentUserId = null;
      if (student.parentPhone) {
         const parentLink = await ParentLinkModel.findOne({ studentId, centerId }).lean();
         if (parentLink) parentUserId = parentLink.parentUserId;
      }

      let communications: any[] = [];
      if (parentUserId) {
        communications = await ParentNotificationModel.find({ parentUserId, centerId })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
      }

      res.status(200).json({
        ok: true,
        data: {
          coreProfile: student,
          assignedTeachers: teachers,
          academicLeaderboard: leaderboard,
          communications,
        }
      });
    } catch (err) {
      console.error("[360Profile] Error:", err);
      res.status(500).json({ ok: false, msg: "Failed to fetch 360 profile" });
    }
  }
);

// === Batch Routes (nested/mounted at /api/users/batches) ===
// Note: We register these on a sub-router or mount them in the main index file. Mounting them under /api/users/batches is extremely clean.
const batchRouter = express.Router();

batchRouter.use(tenantGuard);

batchRouter.post(
  "/",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.createBatch.bind(userController)
);
batchRouter.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  userController.getBatches.bind(userController)
);
batchRouter.get(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  userController.getBatchById.bind(userController)
);
batchRouter.put(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.updateBatch.bind(userController)
);
batchRouter.delete(
  "/:id",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  requireActiveSubscription,
  userController.deleteBatch.bind(userController)
);

export { router as userRoutes, batchRouter as userBatchRoutes };
