import { FilterQuery } from "mongoose";
import { IBaseRepository } from "./IBaseRepository";
import { CenterDocument, ICenter } from "../../../models/center.model";

export interface ICenterRepository extends IBaseRepository<CenterDocument, ICenter> {
  findMany(filter: FilterQuery<CenterDocument>, sort?: Record<string, 1 | -1>): Promise<ICenter[]>;
}
