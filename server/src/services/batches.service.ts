import { inject, injectable } from "tsyringe";
import mongoose from "mongoose";
import { IBatchesService } from "../core/interfaces/services/IBatchesService";
import { IBatchesRepository } from "../core/interfaces/repository/IBatchesRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import {
  BatchFiltersDTO,
  BatchResponseDTO,
  BatchesListResponseDTO,
  CreateBatchDTO,
  UpdateBatchDTO,
} from "../dtos/batches/batches.dto";
import { IBatch } from "../models/batches.model";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";

@injectable()
export class BatchesService implements IBatchesService {
  constructor(
    @inject(TYPES.IBatchesRepository)
    private _batchesRepository: IBatchesRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
  ) {}

  private mapBatch(batch: IBatch, studentCount: number): BatchResponseDTO {
    return {
      id: batch._id.toString(),
      batchName: batch.batchName,
      classLevel: batch.classLevel,
      medium: batch.medium,
      session: batch.session,
      scheduleTime: batch.scheduleTime,
      days: batch.days,
      userId: batch.userId.toString(),
      studentCount,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  private async ensureActiveSubscription(centerId: string, message: string): Promise<void> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    if (center.blocked) {
      throwError("Your center account has been blocked.", StatusCode.FORBIDDEN);
    }
    if (center.subscriptionStatus !== "active") {
      throwError(message, StatusCode.FORBIDDEN);
    }
  }

  async createBatch(centerId: string, payload: CreateBatchDTO): Promise<BatchResponseDTO> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Batch creation disabled.");
    const created = await this._batchesRepository.create({
      batchName: payload.batchName,
      classLevel: payload.classLevel,
      medium: payload.medium,
      session: payload.session,
      scheduleTime: payload.scheduleTime,
      days: payload.days,
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: new mongoose.Types.ObjectId(centerId),
    } as Partial<IBatch>);

    return this.mapBatch(created, 0);
  }

  async getBatches(centerId: string, filters: BatchFiltersDTO): Promise<BatchesListResponseDTO> {
    const batches = await this._batchesRepository.findBatchesByUser(centerId, filters);
    const ids = batches.map((batch) => batch._id.toString());
    const counts = await this._batchesRepository.getStudentCountsForBatches(centerId, ids);

    return {
      batches: batches.map((batch) => this.mapBatch(batch, counts.get(batch._id.toString()) ?? 0)),
      total: batches.length,
    };
  }

  async getBatchById(centerId: string, id: string): Promise<BatchResponseDTO> {
    const batch = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!batch) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const studentCount = await this._batchesRepository.getStudentCountForBatch(centerId, batch._id.toString());
    return this.mapBatch(batch, studentCount);
  }

  async updateBatch(centerId: string, id: string, payload: UpdateBatchDTO): Promise<BatchResponseDTO> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Batch update disabled.");
    const existing = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const updated = await this._batchesRepository.updateBatchByIdAndUser(id, centerId, {
      batchName: payload.batchName ?? existing.batchName,
      classLevel: payload.classLevel ?? existing.classLevel,
      medium: payload.medium ?? existing.medium,
      session: payload.session ?? existing.session,
      scheduleTime: payload.scheduleTime ?? existing.scheduleTime,
      days: payload.days ?? existing.days,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    const studentCount = await this._batchesRepository.getStudentCountForBatch(centerId, updated._id.toString());
    return this.mapBatch(updated, studentCount);
  }

  async deleteBatch(centerId: string, id: string): Promise<void> {
    const existing = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const deleted = await this._batchesRepository.deleteBatchByIdAndUser(id, centerId);
    if (!deleted) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
