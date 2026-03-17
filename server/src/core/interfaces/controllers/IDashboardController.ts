import { Request, Response } from "express";

export interface IDashboardController {
  getDashboard(req: Request, res: Response): Promise<void>;
}
