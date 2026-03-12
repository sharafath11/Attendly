import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IStudentsController } from "../core/interfaces/controllers/IStudentsController";
import { authMiddleware } from "../shared/middleware/auth.middleware";

const router = express.Router();

const studentsController = container.resolve<IStudentsController>(TYPES.IStudentsController);

router.post("/", authMiddleware, studentsController.createStudent.bind(studentsController));
router.get("/", authMiddleware, studentsController.getStudents.bind(studentsController));
router.get("/:id", authMiddleware, studentsController.getStudentById.bind(studentsController));
router.put("/:id", authMiddleware, studentsController.updateStudent.bind(studentsController));
router.delete("/:id", authMiddleware, studentsController.deleteStudent.bind(studentsController));

export default router;
