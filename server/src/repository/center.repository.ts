import { FilterQuery } from "mongoose";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { CenterDocument, CenterModel, ICenter } from "../models/center.model";
import { BaseRepository } from "./baseRepository";
import { MESSAGES } from "../const/messages";

export class CenterRepository
  extends BaseRepository<CenterDocument, ICenter>
  implements ICenterRepository
{
  constructor() {
    super(CenterModel);
  }

  async findMany(
    filter: FilterQuery<CenterDocument>,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<ICenter[]> {
    try {
      return (await this.model.find(filter).sort(sort).lean().exec()) as unknown as ICenter[];
    } catch (error) {
      throw this.handleError(error, MESSAGES.REPOSITORY.FIND_ALL_ERROR);
    }
  }
}
