import { Request, Response } from "express";

export interface IStudentsController {
  createStudent(req: Request, res: Response): Promise<void>;
  getStudents(req: Request, res: Response): Promise<void>;
  getStudentById(req: Request, res: Response): Promise<void>;
  updateStudent(req: Request, res: Response): Promise<void>;
  deleteStudent(req: Request, res: Response): Promise<void>;
}
