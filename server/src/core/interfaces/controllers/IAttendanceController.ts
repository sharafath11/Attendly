import { Request, Response } from "express";

export interface IAttendanceController {
  getStudentAttendanceSummary(req: Request, res: Response): Promise<void>;
  getBatchAttendanceSummary(req: Request, res: Response): Promise<void>;
  getLowAttendanceStudents(req: Request, res: Response): Promise<void>;
  getAttendanceByBatchAndDate(req: Request, res: Response): Promise<void>;
  saveAttendance(req: Request, res: Response): Promise<void>;
  getAttendanceHistory(req: Request, res: Response): Promise<void>;
}
