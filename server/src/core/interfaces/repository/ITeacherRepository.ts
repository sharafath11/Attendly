import { IUser } from "../../../types/userTypes";
import { IBaseRepository } from "./IBaseRepository";

export interface ITeacherRepository extends IBaseRepository<IUser, IUser> {}
