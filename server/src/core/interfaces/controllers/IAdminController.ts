import { Request, Response } from "express";

export interface IAdminController {
  getDashboard(req: Request, res: Response): Promise<void>;
  getDashboardCharts(req: Request, res: Response): Promise<void>;
  listCenters(req: Request, res: Response): Promise<void>;
  getCenterById(req: Request, res: Response): Promise<void>;
  blockCenter(req: Request, res: Response): Promise<void>;
  unblockCenter(req: Request, res: Response): Promise<void>;
  updatePaymentStatus(req: Request, res: Response): Promise<void>;
  verifyCenter(req: Request, res: Response): Promise<void>;
  rejectCenter(req: Request, res: Response): Promise<void>;
  verifySubscriptionPayment(req: Request, res: Response): Promise<void>;
  rejectSubscriptionPayment(req: Request, res: Response): Promise<void>;
  verifyUser(req: Request, res: Response): Promise<void>;
  unverifyUser(req: Request, res: Response): Promise<void>;
}
