import { Request, Response } from "express";

export interface ITeacherAttendanceController {
  saveAttendance(req: Request, res: Response): Promise<void>;
  getAttendance(req: Request, res: Response): Promise<void>;
}
