import { ICenter } from "../../../models/center.model";
import { CenterDocument } from "../../../models/center.model";
import { IBaseRepository } from "./IBaseRepository";
import { AdminRepositoryData } from "../../../types/adminTypes";

export interface IAdminRepository extends IBaseRepository<CenterDocument, ICenter> {
  getDashboardStats(): Promise<AdminRepositoryData>;
  getCenterOwner(centerId: string): Promise<{ id: string; name: string; email: string; isVerified: boolean } | null>;
  getTeachersCount(centerId: string): Promise<number>;
  getStudentsCount(centerId: string): Promise<number>;
}
