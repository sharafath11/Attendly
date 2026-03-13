import { inject, injectable } from "tsyringe";
import mongoose from "mongoose";
import { IBatchesService } from "../core/interfaces/services/IBatchesService";
import { IBatchesRepository } from "../core/interfaces/repository/IBatchesRepository";
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
    private _batchesRepository: IBatchesRepository
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

  async createBatch(userId: string, payload: CreateBatchDTO): Promise<BatchResponseDTO> {
    const created = await this._batchesRepository.create({
      batchName: payload.batchName,
      classLevel: payload.classLevel,
      medium: payload.medium,
      session: payload.session,
      scheduleTime: payload.scheduleTime,
      days: payload.days,
      userId: new mongoose.Types.ObjectId(userId),
    } as Partial<IBatch>);

    return this.mapBatch(created, 0);
  }

  async getBatches(userId: string, filters: BatchFiltersDTO): Promise<BatchesListResponseDTO> {
    const batches = await this._batchesRepository.findBatchesByUser(userId, filters);
    const ids = batches.map((batch) => batch._id.toString());
    const counts = await this._batchesRepository.getStudentCountsForBatches(userId, ids);

    return {
      batches: batches.map((batch) => this.mapBatch(batch, counts.get(batch._id.toString()) ?? 0)),
      total: batches.length,
    };
  }

  async getBatchById(userId: string, id: string): Promise<BatchResponseDTO> {
    const batch = await this._batchesRepository.findBatchByIdAndUser(id, userId);
    if (!batch) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const studentCount = await this._batchesRepository.getStudentCountForBatch(userId, batch._id.toString());
    return this.mapBatch(batch, studentCount);
  }

  async updateBatch(userId: string, id: string, payload: UpdateBatchDTO): Promise<BatchResponseDTO> {
    const existing = await this._batchesRepository.findBatchByIdAndUser(id, userId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const updated = await this._batchesRepository.updateBatchByIdAndUser(id, userId, {
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

    const studentCount = await this._batchesRepository.getStudentCountForBatch(userId, updated._id.toString());
    return this.mapBatch(updated, studentCount);
  }

  async deleteBatch(userId: string, id: string): Promise<void> {
    const existing = await this._batchesRepository.findBatchByIdAndUser(id, userId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const deleted = await this._batchesRepository.deleteBatchByIdAndUser(id, userId);
    if (!deleted) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
