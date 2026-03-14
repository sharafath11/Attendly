import { inject, injectable } from "tsyringe";
import mongoose from "mongoose";
import { IStudentsService } from "../core/interfaces/services/IStudentsService";
import { IStudentsRepository } from "../core/interfaces/repository/IStudentsRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "../dtos/students/students.dto";
import { StudentResponseDTO, StudentsListResponseDTO } from "../dtos/students/students.dto";
import { throwError } from "../utils/response";
import { MESSAGES } from "../const/messages";
import { StatusCode } from "../enums/statusCode";
import { IStudent } from "../models/students.model";

@injectable()
export class StudentsService implements IStudentsService {
  constructor(
    @inject(TYPES.IStudentsRepository)
    private _studentsRepository: IStudentsRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
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

  private async ensureBatchOwnership(batchId: string, centerId: string): Promise<void> {
    const BatchModel = mongoose.models.Batch as mongoose.Model<any> | undefined;
    if (!BatchModel) {
      throwError("Batch model is not registered", StatusCode.INTERNAL_SERVER_ERROR);
    }

    const batch = await BatchModel.findOne({
      _id: batchId,
      $or: [{ centerId: new mongoose.Types.ObjectId(centerId) }, { userId: centerId }],
    })
      .lean()
      .exec();
    if (!batch) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
  }

  private async ensureActiveSubscription(centerId: string, message: string): Promise<void> {
    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }
    if (center.blocked) {
      throwError("Your center account has been blocked.", StatusCode.FORBIDDEN);
    }
    if (center.subscriptionStatus !== "active") {
      throwError(message, StatusCode.FORBIDDEN);
    }
  }

  async createStudent(centerId: string, payload: CreateStudentDTO): Promise<StudentResponseDTO> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Student creation disabled.");
    const center = await this._centerRepository.findById(centerId);
    const studentLimit = center?.studentLimit ?? 150;
    const existingCount = await this._studentsRepository.count({
      $or: [{ centerId: new mongoose.Types.ObjectId(centerId) }, { userId: centerId }],
      isDeleted: false,
    });

    if (existingCount >= studentLimit) {
      throwError("Student limit reached for your subscription plan.", StatusCode.BAD_REQUEST);
    }

    await this.ensureBatchOwnership(payload.batchId, centerId);

    const student = await this._studentsRepository.create({
      name: payload.name,
      phone: payload.phone,
      parentPhone: payload.parentPhone,
      batchId: new mongoose.Types.ObjectId(payload.batchId),
      monthlyFee: payload.monthlyFee,
      joinDate: new Date(payload.joinDate),
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: new mongoose.Types.ObjectId(centerId),
    } as Partial<IStudent>);

    return this.mapStudent(student);
  }

  async getStudents(centerId: string, query: StudentQueryDTO): Promise<StudentsListResponseDTO> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, unknown> = {
      $or: [{ centerId: new mongoose.Types.ObjectId(centerId) }, { userId: centerId }],
      isDeleted: false,
    };

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    let sessionBatchIds: mongoose.Types.ObjectId[] | null = null;
    if (query.session) {
      const BatchModel = mongoose.models.Batch as mongoose.Model<any> | undefined;
      if (!BatchModel) {
        throwError("Batch model is not registered", StatusCode.INTERNAL_SERVER_ERROR);
      }

      const sessionBatches = await BatchModel.find({
        session: query.session,
        $or: [{ centerId: new mongoose.Types.ObjectId(centerId) }, { userId: centerId }],
      })
        .select("_id")
        .lean()
        .exec();
      sessionBatchIds = sessionBatches.map((batch) => batch._id as mongoose.Types.ObjectId);

      if (sessionBatchIds.length === 0) {
        return {
          students: [],
          total: 0,
          page,
          pages: 1,
        };
      }
    }

    if (query.batchId) {
      const batchObjectId = new mongoose.Types.ObjectId(query.batchId);
      if (sessionBatchIds) {
        const inSession = sessionBatchIds.some((id) => id.toString() === batchObjectId.toString());
        if (!inSession) {
          return {
            students: [],
            total: 0,
            page,
            pages: 1,
          };
        }
      }
      filter.batchId = batchObjectId;
    } else if (sessionBatchIds) {
      filter.batchId = { $in: sessionBatchIds };
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

  async getStudentById(centerId: string, id: string): Promise<StudentResponseDTO> {
    const student = await this._studentsRepository.findById(id);
    if (!student || student.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (
      student.centerId?.toString() !== centerId &&
      student.userId?.toString() !== centerId
    ) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    return this.mapStudent(student);
  }

  async updateStudent(centerId: string, id: string, payload: UpdateStudentDTO): Promise<StudentResponseDTO> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Student update disabled.");
    const existing = await this._studentsRepository.findById(id);
    if (!existing || existing.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (
      existing.centerId?.toString() !== centerId &&
      existing.userId?.toString() !== centerId
    ) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    if (payload.batchId) {
      await this.ensureBatchOwnership(payload.batchId, centerId);
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

  async deleteStudent(centerId: string, id: string): Promise<void> {
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Student deletion disabled.");
    const existing = await this._studentsRepository.findById(id);
    if (!existing || existing.isDeleted) {
      throwError("Student not found", StatusCode.NOT_FOUND);
    }

    if (
      existing.centerId?.toString() !== centerId &&
      existing.userId?.toString() !== centerId
    ) {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    const deleted = await this._studentsRepository.softDelete(id);
    if (!deleted) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
