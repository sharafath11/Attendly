import { Request, Response } from "express";

export interface ITeacherPaymentsController {
  createPayment(req: Request, res: Response): Promise<void>;
  getPayments(req: Request, res: Response): Promise<void>;
}
