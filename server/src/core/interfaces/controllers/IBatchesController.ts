import { Request, Response } from "express";

export interface IBatchesController {
  createBatch(req: Request, res: Response): Promise<void>;
  getBatches(req: Request, res: Response): Promise<void>;
  getBatchById(req: Request, res: Response): Promise<void>;
  updateBatch(req: Request, res: Response): Promise<void>;
  deleteBatch(req: Request, res: Response): Promise<void>;
}
