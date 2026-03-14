import { Request, Response } from "express";

export interface ITeacherController {
  createTeacher(req: Request, res: Response): Promise<void>;
  getTeachers(req: Request, res: Response): Promise<void>;
  getTeacherById(req: Request, res: Response): Promise<void>;
  updateTeacherStatus(req: Request, res: Response): Promise<void>;
  updateTeacher(req: Request, res: Response): Promise<void>;
  resetTeacherPassword(req: Request, res: Response): Promise<void>;
  deleteTeacher(req: Request, res: Response): Promise<void>;
}
