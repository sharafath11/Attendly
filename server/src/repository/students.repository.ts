import mongoose, { FilterQuery, ProjectionType } from "mongoose";
import { IStudentsRepository } from "../core/interfaces/repository/IStudentsRepository";
import { StudentModel, IStudent, StudentDocument } from "../models/students.model";
import { BaseRepository } from "./baseRepository";
import { MESSAGES } from "../const/messages";

interface FindManyOptions {
  page: number;
  limit: number;
  projection?: ProjectionType<IStudent>;
  sort?: Record<string, 1 | -1>;
}

export class StudentsRepository
  extends BaseRepository<StudentDocument, IStudent>
  implements IStudentsRepository
{
  constructor() {
    super(StudentModel);
  }

  async findMany(filter: FilterQuery<StudentDocument>, options: FindManyOptions) {
    try {
      const { page, limit, projection, sort } = options;
      const skip = (page - 1) * limit;

      const [students, total] = await Promise.all([
        this.model
          .find(filter, projection)
          .sort(sort ?? { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter),
      ]);

      return { students, total };
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }

  async findById(id: string, projection?: ProjectionType<IStudent>): Promise<IStudent | null> {
    try {
      return this.model.findById(id, projection).lean().exec();
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_BY_ID_ERROR);
    }
  }

  async update(id: string, data: Partial<IStudent>): Promise<IStudent | null> {
    try {
      return this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ERROR);
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean().exec();
      return Boolean(result);
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.UPDATE_ERROR);
    }
  }

  async findManyCursor(
    filter: FilterQuery<StudentDocument>,
    options: {
      limit: number;
      cursor?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<IStudent[]> {
    try {
      const { limit, cursor, sortBy = "createdAt", sortOrder = "desc" } = options;
      const order = sortOrder === "asc" ? 1 : -1;

      let queryFilter = { ...filter };
      if (cursor) {
        const operator = sortOrder === "asc" ? "$gt" : "$lt";
        
        if (sortBy === "_id") {
          queryFilter._id = { [operator]: new mongoose.Types.ObjectId(cursor) };
        } else {
          // Compound cursor format: value_id
          const parts = cursor.split("_");
          const cursorValue = parts[0];
          const cursorId = parts[1];

          let parsedValue: any = cursorValue;
          if (sortBy === "createdAt" || sortBy === "joinDate") {
            parsedValue = new Date(cursorValue);
          } else if (!isNaN(Number(cursorValue)) && cursorValue.trim() !== "") {
            parsedValue = Number(cursorValue);
          }

          if (cursorId) {
            queryFilter.$or = [
              { [sortBy]: { [operator]: parsedValue } },
              {
                [sortBy]: parsedValue,
                _id: { [operator]: new mongoose.Types.ObjectId(cursorId) },
              },
            ];
          } else {
            queryFilter[sortBy] = { [operator]: parsedValue };
          }
        }
      }

      return await this.model
        .find(queryFilter)
        .sort({ [sortBy]: order, _id: order })
        .limit(limit + 1)
        .lean()
        .exec() as unknown as IStudent[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
