import { Request, Response } from "express";

export interface ICenterController {
  registerCenter(req: Request, res: Response): Promise<void>;
  getCenterStatus(req: Request, res: Response): Promise<void>;
  getMyCenter(req: Request, res: Response): Promise<void>;
}
