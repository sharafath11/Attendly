import { ITeacherRepository } from "../core/interfaces/repository/ITeacherRepository";
import { UserModel } from "../models/user.Model";
import { IUser } from "../types/userTypes";
import { BaseRepository } from "./baseRepository";

export class TeacherRepository extends BaseRepository<IUser, IUser> implements ITeacherRepository {
  constructor() {
    super(UserModel);
  }
}
