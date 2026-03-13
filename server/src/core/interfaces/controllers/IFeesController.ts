import { Request, Response } from "express";

export interface IFeesController {
  getFees(req: Request, res: Response): Promise<void>;
  markFeePaid(req: Request, res: Response): Promise<void>;
  updateFeeStatus(req: Request, res: Response): Promise<void>;
  getPendingFees(req: Request, res: Response): Promise<void>;
}
