import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../../core/types";
import { IStudentsController } from "../../core/interfaces/controllers/IStudentsController";
import { authMiddleware } from "../../shared/middleware/auth.middleware";

const router = express.Router();

const studentsController = container.resolve<IStudentsController>(TYPES.IStudentsController);

router.use(authMiddleware);

router.post("/", studentsController.createStudent.bind(studentsController));
router.get("/", studentsController.getStudents.bind(studentsController));
router.get("/:id", studentsController.getStudentById.bind(studentsController));
router.put("/:id", studentsController.updateStudent.bind(studentsController));
router.delete("/:id", studentsController.deleteStudent.bind(studentsController));

export default router;
