import { inject, injectable, container } from "tsyringe";
import mongoose from "mongoose";
import { NotificationOrchestratorService } from "../../services/notificationOrchestrator.service";
import { IStudentsService } from "../../core/interfaces/services/IStudentsService";
import { IBatchesService } from "../../core/interfaces/services/IBatchesService";
import { IStudentsRepository } from "../../core/interfaces/repository/IStudentsRepository";
import { IBatchesRepository } from "../../core/interfaces/repository/IBatchesRepository";
import { ICenterRepository } from "../../core/interfaces/repository/ICenterRepository";
import { ITeacherRepository } from "../../core/interfaces/repository/ITeacherRepository";
import { TYPES } from "../../core/types";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO, StudentResponseDTO, PaginatedStudentsResponseDTO } from "../../dtos/students/students.dto";
import { generateNextCustomId } from "../../services/counter.service";
import { enqueueWhatsAppMessage } from "../../services/whatsappQueue.service";
import { BatchFiltersDTO, BatchResponseDTO, BatchesListResponseDTO, CreateBatchDTO, UpdateBatchDTO } from "../../dtos/batches/batches.dto";
import { throwError } from "../../utils/response";
import { logActivity } from "../../utils/activityLog.util";
import { MESSAGES } from "../../const/messages";
import { StatusCode } from "../../enums/statusCode";
import { IStudent, StudentModel } from "../../models/students.model";
import { IBatch } from "../../models/batches.model";
import { FeeModel } from "../../models/fees.model";
import { UserModel } from "../../models/user.Model";
import { ParentLinkModel } from "../../models/parentLink.model";
import { ensureActiveSubscription, ensureTeacherInCenter } from "../../shared/helpers/tenantGuard";
import crypto from "crypto";
import bcryptjs from "bcryptjs";

@injectable()
export class UserService implements IStudentsService, IBatchesService {
  constructor(
    @inject(TYPES.IStudentsRepository)
    private _studentsRepository: IStudentsRepository,
    @inject(TYPES.IBatchesRepository)
    private _batchesRepository: IBatchesRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository,
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository
  ) {}

  // ==========================================
  // === Students Management ===
  // ==========================================

  private mapStudent(student: IStudent): StudentResponseDTO {
    return {
      id: student._id.toString(),
      name: student.name,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      batchId: student.batchId.toString(),
      monthlyFee: student.monthlyFee,
      joinDate: student.joinDate,
      userId: student.userId.toString(),
      customId: student.customId,
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

  async createStudent(centerId: string, payload: CreateStudentDTO, actorUserId?: string): Promise<StudentResponseDTO> {
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Student creation disabled.");
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

    const customId = await generateNextCustomId(centerId, "student");

    const student = await this._studentsRepository.create({
      name: payload.name,
      phone: payload.phone,
      parentName: payload.parentName,
      parentPhone: payload.parentPhone,
      batchId: new mongoose.Types.ObjectId(payload.batchId),
      monthlyFee: payload.monthlyFee,
      joinDate: new Date(payload.joinDate),
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: new mongoose.Types.ObjectId(centerId),
      customId,
    } as Partial<IStudent>);

    // Automated Welcome Trigger & Parent Provisioning
    if (payload.parentPhone) {
      // 1. Provision Parent in UserModel
      let parentUser = await UserModel.findOne({
        centerId: new mongoose.Types.ObjectId(centerId),
        phone: payload.parentPhone,
        role: "parent",
      });

      if (!parentUser) {
        const parentCustomId = await generateNextCustomId(centerId, "parent");
        const passwordHash = await bcryptjs.hash(crypto.randomBytes(24).toString("hex"), 10);
        parentUser = await UserModel.create({
          username: `parent_${payload.parentPhone}_${centerId.slice(-5)}`,
          email: `parent.${centerId}.${payload.parentPhone}@parents.attendly.app`,
          password: passwordHash,
          role: "parent",
          centerId: new mongoose.Types.ObjectId(centerId),
          phone: payload.parentPhone,
          isVerified: true,
          status: "active",
          name: payload.parentName,
          customId: parentCustomId,
        });
      }

      // 2. Link Parent to Student
      await ParentLinkModel.updateOne(
        { parentUserId: parentUser._id, studentId: student._id },
        {
          $set: {
            centerId: new mongoose.Types.ObjectId(centerId),
            parentUserId: parentUser._id,
            studentId: student._id,
            relation: "parent",
          },
        },
        { upsert: true }
      );

      // 3. Send Welcome Message
      const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
      const welcomeMessage = `Dear ${payload.parentName}, Welcome to ${center?.name || 'our'} digital portal powered by Attendly. You will receive real-time updates regarding your child ${payload.name}'s attendance, exam marks, and fee invoices on this number. (Ref: ${timestamp})`;
      
      await enqueueWhatsAppMessage({
        phone: payload.parentPhone,
        message: welcomeMessage,
        centerId,
      }).catch((err) => console.error("Failed to enqueue welcome message", err));
    }

    await logActivity({
      centerId,
      actorUserId: actorUserId ?? centerId,
      action: "student_created",
      entityType: "student",
      entityId: student._id.toString(),
      summary: `Student created: ${payload.name}`,
    });

    return this.mapStudent(student);
  }

  async getStudents(centerId: string, query: StudentQueryDTO): Promise<PaginatedStudentsResponseDTO> {
    const limit = Number(query.limit) || 10;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const filter: Record<string, any> = {
      $and: [
        {
          $or: [
            { centerId: new mongoose.Types.ObjectId(centerId) },
            { userId: centerId },
          ],
        },
        { isDeleted: false },
      ],
    };

    if (query.search) {
      filter.$and.push({
        $or: [
          { name: { $regex: query.search, $options: "i" } },
          { parentPhone: { $regex: query.search, $options: "i" } },
          { customId: { $regex: query.search, $options: "i" } },
        ],
      });
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
          success: true,
          data: [],
          nextCursor: null,
          hasNextPage: false,
        };
      }
    }

    if (query.batchId) {
      const batchObjectId = new mongoose.Types.ObjectId(query.batchId);
      if (sessionBatchIds) {
        const inSession = sessionBatchIds.some((id) => id.toString() === batchObjectId.toString());
        if (!inSession) {
          return {
            success: true,
            data: [],
            nextCursor: null,
            hasNextPage: false,
          };
        }
      }
      filter.$and.push({ batchId: batchObjectId });
    } else if (sessionBatchIds) {
      filter.$and.push({ batchId: { $in: sessionBatchIds } });
    }

    const students = await this._studentsRepository.findManyCursor(filter, {
      limit,
      cursor: query.cursor,
      sortBy,
      sortOrder,
    });

    const hasNextPage = students.length > limit;
    const paginatedData = hasNextPage ? students.slice(0, limit) : students;

    let nextCursor: string | null = null;
    if (hasNextPage && paginatedData.length > 0) {
      const lastItem = paginatedData[paginatedData.length - 1];
      if (sortBy === "_id") {
        nextCursor = lastItem._id.toString();
      } else {
        let val: string;
        if (sortBy === "createdAt") {
          val = lastItem.createdAt.toISOString();
        } else if (sortBy === "joinDate") {
          val = lastItem.joinDate.toISOString();
        } else {
          val = String((lastItem as any)[sortBy] ?? "");
        }
        nextCursor = `${val}_${lastItem._id.toString()}`;
      }
    }

    return {
      success: true,
      data: paginatedData.map((student) => this.mapStudent(student)),
      nextCursor,
      hasNextPage,
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
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Student update disabled.");
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

    const batchChanged =
      payload.batchId && payload.batchId !== existing.batchId.toString();
    if (batchChanged) {
      const now = new Date();
      const istStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const [istYear, istMonth] = istStr.split("-").map(Number);

      await FeeModel.updateMany(
        {
          studentId: existing._id,
          month: istMonth,
          year: istYear,
          status: "Pending",
        },
        { $set: { batchId: new mongoose.Types.ObjectId(payload.batchId!) } }
      );
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

  async deleteStudent(centerId: string, id: string, actorUserId?: string): Promise<void> {
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Student deletion disabled.");
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

    await logActivity({
      centerId,
      actorUserId: actorUserId ?? centerId,
      action: "student_deleted",
      entityType: "student",
      entityId: id,
      summary: `Student removed: ${existing.name}`,
    });
  }

  // ==========================================
  // === Batch Management ===
  // ==========================================

  private mapBatch(batch: IBatch, studentCount: number): BatchResponseDTO {
    return {
      id: batch._id.toString(),
      batchName: batch.batchName,
      classLevel: batch.classLevel,
      medium: batch.medium,
      session: batch.session,
      scheduleTime: batch.scheduleTime,
      days: batch.days,
      subjects: batch.subjects,
      userId: batch.userId.toString(),
      studentCount,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  async createBatch(centerId: string, payload: CreateBatchDTO): Promise<BatchResponseDTO> {
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Batch creation disabled.");
    const created = await this._batchesRepository.create({
      batchName: payload.batchName,
      classLevel: payload.classLevel,
      medium: payload.medium,
      session: payload.session,
      scheduleTime: payload.scheduleTime,
      days: payload.days,
      subjects: payload.subjects,
      centerId: new mongoose.Types.ObjectId(centerId),
      userId: new mongoose.Types.ObjectId(centerId),
    } as Partial<IBatch>);

    return this.mapBatch(created, 0);
  }

  async getBatches(centerId: string, filters: BatchFiltersDTO): Promise<BatchesListResponseDTO> {
    const batches = await this._batchesRepository.findBatchesByUser(centerId, filters);
    const ids = batches.map((batch) => batch._id.toString());
    const counts = await this._batchesRepository.getStudentCountsForBatches(centerId, ids);

    return {
      batches: batches.map((batch) => this.mapBatch(batch, counts.get(batch._id.toString()) ?? 0)),
      total: batches.length,
    };
  }

  async getBatchById(centerId: string, id: string): Promise<BatchResponseDTO> {
    const batch = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!batch) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const studentCount = await this._batchesRepository.getStudentCountForBatch(centerId, batch._id.toString());
    return this.mapBatch(batch, studentCount);
  }

  async updateBatch(centerId: string, id: string, payload: UpdateBatchDTO): Promise<BatchResponseDTO> {
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Batch update disabled.");
    const existing = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const updated = await this._batchesRepository.updateBatchByIdAndUser(id, centerId, {
      batchName: payload.batchName ?? existing.batchName,
      classLevel: payload.classLevel ?? existing.classLevel,
      medium: payload.medium ?? existing.medium,
      session: payload.session ?? existing.session,
      scheduleTime: payload.scheduleTime ?? existing.scheduleTime,
      days: payload.days ?? existing.days,
      subjects: payload.subjects ?? existing.subjects,
    });

    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    const studentCount = await this._batchesRepository.getStudentCountForBatch(centerId, updated._id.toString());
    return this.mapBatch(updated, studentCount);
  }

  async deleteBatch(centerId: string, id: string): Promise<void> {
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Batch deletion disabled.");

    const existing = await this._batchesRepository.findBatchByIdAndUser(id, centerId);
    if (!existing) {
      throwError("Batch not found", StatusCode.NOT_FOUND);
    }

    const activeStudentCount = await StudentModel.countDocuments({
      batchId: new mongoose.Types.ObjectId(id),
      isDeleted: false,
    });
    if (activeStudentCount > 0) {
      throwError(
        `Cannot delete batch — ${activeStudentCount} active student(s) are still assigned to it. Reassign or remove them first.`,
        StatusCode.CONFLICT
      );
    }

    const deleted = await this._batchesRepository.deleteBatchByIdAndUser(id, centerId);
    if (!deleted) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
