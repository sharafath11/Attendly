import { FilterQuery, ProjectionType } from "mongoose";
import { IStudent, StudentDocument } from "../../../models/students.model";

export interface IStudentsRepository {
  create(data: Partial<IStudent>): Promise<IStudent>;
  findMany(
    filter: FilterQuery<StudentDocument>,
    options: {
      page: number;
      limit: number;
      projection?: ProjectionType<IStudent>;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<{ students: IStudent[]; total: number }>;
  findById(id: string, projection?: ProjectionType<IStudent>): Promise<IStudent | null>;
  update(id: string, data: Partial<IStudent>): Promise<IStudent | null>;
  softDelete(id: string): Promise<boolean>;
  count(filter: FilterQuery<StudentDocument>): Promise<number>;
}
