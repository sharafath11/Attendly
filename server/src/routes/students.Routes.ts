import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IStudentsController } from "../core/interfaces/controllers/IStudentsController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";
import { requireActiveSubscription } from "../shared/middleware/subscription.middleware";

const router = express.Router();

const studentsController = container.resolve<IStudentsController>(TYPES.IStudentsController);

router.post(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  studentsController.createStudent.bind(studentsController)
);
router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  studentsController.getStudents.bind(studentsController)
);
router.get(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  studentsController.getStudentById.bind(studentsController)
);
router.put(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  studentsController.updateStudent.bind(studentsController)
);
router.delete(
  "/:id",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  requireActiveSubscription,
  studentsController.deleteStudent.bind(studentsController)
);

export default router;
