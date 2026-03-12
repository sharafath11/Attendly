import { inject, injectable } from "tsyringe";
import mongoose from "mongoose";
import { IStudentsService } from "../../core/interfaces/services/IStudentsService";
import { IStudentsRepository } from "../../core/interfaces/repository/IStudentsRepository";
import { TYPES } from "../../core/types";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "./students.dto";
import { StudentResponseDTO, StudentsListResponseDTO } from "./students.dto";
import { throwError } from "../../utils/response";
import { MESSAGES } from "../../const/messages";
import { StatusCode } from "../../enums/statusCode";
import { IStudent } from "./students.model";

@injectable()
export class StudentsService implements IStudentsService {
  constructor(
    @inject(TYPES.IStudentsRepository)
    private _studentsRepository: IStudentsRepository
  ) {}

  private mapStudent(student: IStudent): StudentResponseDTO {
    return {
      id: student._id.toString(),
      name: student.name,
      phone: student.phone,
      parentPhone: student.parentPhone,
      batchId: student.batchId.toString(),
      monthlyFee: student.monthlyFee,
      joinDate: student.joinDate,
      userId: student.userId.toString(),
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  private async ensureBatchOwnership(batchId: string, userId: string): Promise<void> {
    const BatchModel = mongoose.models.Batch as mongoose.Model<any> | undefined;
    if (!BatchModel) {
      throwError("Batch model is not registered", StatusCode.INTERNAL_SERVER_ERROR);
    }

    const batch = await BatchModel.findOne({ _id: batchId, userId }).lean().exec();
    if (!batch) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
  }

  async createStudent(userId: string, payload: CreateStudentDTO): Promise<StudentResponseDTO> {
    await this.ensureBatchOwnership(payload.batchId, userId);

    const student = await this._studentsRepository.create({
      name: payload.name,
      phone: payload.phone,
      parentPhone: payload.parentPhone,
      batchId: new mongoose.Types.ObjectId(payload.batchId),
      monthlyFee: payload.monthlyFee,
      joinDate: new Date(payload.joinDate),
      userId: new mongoose.Types.ObjectId(userId),
    } as Partial<IStudent>);

    return this.mapStudent(student);
  }

  async getStudents(userId: string, query: StudentQueryDTO): Promise<StudentsListResponseDTO> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    if (query.batchId) {
      filter.batchId = new mongoose.Types.ObjectId(query.batchId);
    }

    const { students, total } = await this._studentsRepository.findMany(filter, {
      page,
      limit,
      projection: { isDeleted: 0 },
    });

    return {
      students: students.map((student) => this.mapStudent(student)),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async getStudentById(userId: string, id: string): Promise<StudentResponseDTO> {
    const student = await this._studentsRepository.findById(id);
    if (!student || student.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (student.userId.toString() !== userId) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    return this.mapStudent(student);
  }

  async updateStudent(userId: string, id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO> {
    const existing = await this._studentsRepository.findById(id);
    if (!existing || existing.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (existing.userId.toString() !== userId) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    if (payload.batchId) {
      await this.ensureBatchOwnership(payload.batchId, userId);
    }

    const updated = await this._studentsRepository.update(id, {
      name: payload.name ?? existing.name,
      phone: payload.phone ?? existing.phone,
      parentPhone: payload.parentPhone ?? existing.parentPhone,
      batchId: payload.batchId ? new mongoose.Types.ObjectId(payload.batchId) : existing.batchId,
      monthlyFee: payload.monthlyFee ?? existing.monthlyFee,
      joinDate: payload.joinDate ? new Date(payload.joinDate) : existing.joinDate,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    return this.mapStudent(updated);
  }

  async deleteStudent(userId: string, id: string): Promise<void> {
    const existing = await this._studentsRepository.findById(id);
    if (!existing || existing.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (existing.userId.toString() !== userId) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    const deleted = await this._studentsRepository.softDelete(id);
    if (!deleted) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
