import mongoose, { FilterQuery } from "mongoose";
import { BatchModel, BatchDocument, IBatch } from "../models/batches.model";
import { IBatchesRepository } from "../core/interfaces/repository/IBatchesRepository";
import { BatchFiltersDTO } from "../dtos/batches/batches.dto";
import { BaseRepository } from "./baseRepository";
import { MESSAGES } from "../const/messages";
import { StudentModel } from "../models/students.model";

export class BatchesRepository
  extends BaseRepository<BatchDocument, IBatch>
  implements IBatchesRepository
{
  constructor() {
    super(BatchModel);
  }

  async findBatchesByUser(userId: string, filters: BatchFiltersDTO): Promise<IBatch[]> {
    try {
      const query: FilterQuery<BatchDocument> = {
        userId: new mongoose.Types.ObjectId(userId),
      };

      if (filters.medium) {
        query.medium = filters.medium;
      }

      if (filters.session) {
        query.session = filters.session;
      }

      return (await this.model
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec()) as IBatch[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async findBatchByIdAndUser(id: string, userId: string): Promise<IBatch | null> {
    try {
      return (await this.model
        .findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) })
        .lean()
        .exec()) as IBatch | null;
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ONE_ERROR);
    }
  }

  async updateBatchByIdAndUser(
    id: string,
    userId: string,
    data: Partial<IBatch>
  ): Promise<IBatch | null> {
    try {
      return (await this.model
        .findOneAndUpdate({ _id: id, userId: new mongoose.Types.ObjectId(userId) }, data, { new: true })
        .lean()
        .exec()) as IBatch | null;
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ERROR);
    }
  }

  async deleteBatchByIdAndUser(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.model.findOneAndDelete({
        _id: id,
        userId: new mongoose.Types.ObjectId(userId),
      });
      return result !== null;
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.DELETE_ERROR);
    }
  }

  async getStudentCountsForBatches(userId: string, batchIds: string[]): Promise<Map<string, number>> {
    try {
      if (batchIds.length === 0) return new Map();

      const ids = batchIds.map((id) => new mongoose.Types.ObjectId(id));

      const counts = await StudentModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            isDeleted: false,
            batchId: { $in: ids },
          },
        },
        { $group: { _id: "$batchId", count: { $sum: 1 } } },
      ]);

      const map = new Map<string, number>();
      counts.forEach((entry) => {
        map.set(String(entry._id), entry.count);
      });

      return map;
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.COUNT_ERROR);
    }
  }

  async getStudentCountForBatch(userId: string, batchId: string): Promise<number> {
    try {
      return await StudentModel.countDocuments({
        batchId: new mongoose.Types.ObjectId(batchId),
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      });
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.COUNT_ERROR);
    }
  }
}
