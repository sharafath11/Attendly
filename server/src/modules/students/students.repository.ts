import { FilterQuery, ProjectionType } from "mongoose";
import { IStudentsRepository } from "../../core/interfaces/repository/IStudentsRepository";
import { StudentModel, IStudent, StudentDocument } from "./students.model";

interface FindManyOptions {
  page: number;
  limit: number;
  projection?: ProjectionType<IStudent>;
  sort?: Record<string, 1 | -1>;
}

export class StudentsRepository implements IStudentsRepository {
  async create(data: Partial<IStudent>): Promise<IStudent> {
    const created = await StudentModel.create(data);
    return created.toObject();
  }

  async findMany(filter: FilterQuery<StudentDocument>, options: FindManyOptions) {
    const { page, limit, projection, sort } = options;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      StudentModel.find(filter, projection)
        .sort(sort ?? { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      StudentModel.countDocuments(filter),
    ]);

    return { students, total };
  }

  async findById(id: string, projection?: ProjectionType<IStudent>): Promise<IStudent | null> {
    return StudentModel.findById(id, projection).lean().exec();
  }

  async update(id: string, data: Partial<IStudent>): Promise<IStudent | null> {
    return StudentModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean().exec();
    return Boolean(result);
  }
}
