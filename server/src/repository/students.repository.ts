import { FilterQuery, ProjectionType } from "mongoose";
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
}
