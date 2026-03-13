import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IAttendanceController } from "../core/interfaces/controllers/IAttendanceController";
import { authMiddleware } from "../shared/middleware/auth.middleware";

const router = express.Router();

const attendanceController = container.resolve<IAttendanceController>(TYPES.IAttendanceController);

router.get("/", authMiddleware, attendanceController.getAttendanceByBatchAndDate.bind(attendanceController));
router.post("/", authMiddleware, attendanceController.saveAttendance.bind(attendanceController));

router.get(
  "/student/:studentId/summary",
  authMiddleware,
  attendanceController.getStudentAttendanceSummary.bind(attendanceController)
);

router.get(
  "/batch/:batchId/summary",
  authMiddleware,
  attendanceController.getBatchAttendanceSummary.bind(attendanceController)
);

router.get(
  "/batch/:batchId/low-attendance",
  authMiddleware,
  attendanceController.getLowAttendanceStudents.bind(attendanceController)
);

export default router;
