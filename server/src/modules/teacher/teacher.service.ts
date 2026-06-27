import { inject, injectable, container } from "tsyringe";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { NotificationOrchestratorService } from "../../services/notificationOrchestrator.service";
import mongoose from "mongoose";
import { generateNextCustomId } from "../../services/counter.service";
import { ITeacherService } from "../../core/interfaces/services/ITeacherService";
import { ITeacherAttendanceService } from "../../core/interfaces/services/ITeacherAttendanceService";
import { ITeacherPaymentsService } from "../../core/interfaces/services/ITeacherPaymentsService";
import { ITeacherRepository } from "../../core/interfaces/repository/ITeacherRepository";
import { ITeacherAttendanceRepository } from "../../core/interfaces/repository/ITeacherAttendanceRepository";
import { ITeacherPaymentsRepository } from "../../core/interfaces/repository/ITeacherPaymentsRepository";
import { ICenterRepository } from "../../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../../core/types";
import {
  CreateTeacherDTO,
  CreateTeacherResponseDTO,
  TeacherResponseDTO,
  UpdateTeacherDTO,
  UpdateTeacherStatusDTO,
} from "../../dtos/teacher/teacher.dto";
import {
  CreateTeacherAttendanceDTO,
  TeacherAttendanceFiltersDTO,
  TeacherAttendanceRecordDTO,
} from "../../dtos/teacherAttendance/teacherAttendance.dto";
import {
  CreateTeacherPaymentDTO,
  TeacherPaymentFiltersDTO,
  TeacherPaymentRecordDTO,
} from "../../dtos/teacherPayments/teacherPayments.dto";
import { throwError } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";
import { IUser } from "../../types/userTypes";
import { ensureActiveSubscription, ensureTeacherInCenter } from "../../shared/helpers/tenantGuard";

@injectable()
export class TeacherService implements ITeacherService, ITeacherAttendanceService, ITeacherPaymentsService {
  constructor(
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository,
    @inject(TYPES.ITeacherAttendanceRepository)
    private _teacherAttendanceRepository: ITeacherAttendanceRepository,
    @inject(TYPES.ITeacherPaymentsRepository)
    private _teacherPaymentsRepository: ITeacherPaymentsRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository,
    private _notifications: NotificationOrchestratorService
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mapTeacher(user: IUser): TeacherResponseDTO {
    return {
      id: user._id.toString(),
      name: user.name ?? user.username,
      username: user.username,
      customId: user.customId,
      phone: user.phone,
      subjects: Array.isArray(user.subjects) ? user.subjects : [],
      salary: user.salary,
      role: "teacher",
      centerId: user.centerId ? user.centerId.toString() : user._id.toString(),
      status: (user.status ?? "active") as "active" | "disabled",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async getOwnerAndCenter(authUserId: string) {
    const owner = await this._teacherRepository.findById(authUserId);
    if (!owner) {
      throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
    }
    const role = owner.role ?? "center_owner";
    if (role !== "center_owner") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
    return {
      owner,
      centerId: owner.centerId ? owner.centerId.toString() : owner._id.toString(),
    };
  }

  private async getViewerAndCenter(authUserId: string) {
    const user = await this._teacherRepository.findById(authUserId);
    if (!user) {
      throwError(MESSAGES.AUTH.AUTH_REQUIRED, StatusCode.UNAUTHORIZED);
    }
    const role = user.role ?? "center_owner";
    if (role !== "center_owner" && role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
    return {
      user,
      centerId: user.centerId ? user.centerId.toString() : user._id.toString(),
      role,
    };
  }

  private slugifyCenterName(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    return normalized.length > 0 ? normalized : "center";
  }

  private generateTempPassword(): string {
    return crypto.randomBytes(4).toString("hex");
  }

  private async generateTeacherUsername(centerName: string, centerId: string): Promise<string> {
    const base = `${this.slugifyCenterName(centerName)}_teacher_`;
    const count = await this._teacherRepository.count({ centerId, role: "teacher" });
    let sequence = Math.max(1, count + 1);
    while (true) {
      const candidate = `${base}${String(sequence).padStart(2, "0")}`;
      const exists = await this._teacherRepository.findOne({ centerId, username: candidate });
      if (!exists) return candidate;
      sequence += 1;
    }
  }

  // === Core ===

  async createTeacher(authUserId: string, payload: CreateTeacherDTO): Promise<CreateTeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher creation disabled.");

    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }

    const teacherCount = await this._teacherRepository.count({
      centerId: new mongoose.Types.ObjectId(centerId),
      role: "teacher",
    });
    const teacherLimit = center.teacherLimit ?? 50;
    if (teacherCount >= teacherLimit) {
      throwError(`Teacher limit reached (${teacherLimit}) for your subscription.`, StatusCode.BAD_REQUEST);
    }

    const username = await this.generateTeacherUsername(center.name, centerId);
    const tempPassword = this.generateTempPassword();
    const email = `${username}@teacher.local`;

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const customId = await generateNextCustomId(centerId, "teacher");

    const createdTeacher = await this._teacherRepository.create({
      name: payload.name,
      username,
      email,
      phone: payload.phone,
      subjects: payload.subjects ?? [],
      salary: payload.salary,
      password: hashedPassword,
      role: "teacher",
      centerId,
      customId,
      status: "active",
      isVerified: true,
    });

    if (payload.subjects && payload.subjects.length > 0) {
      const orchestrator = container.resolve(NotificationOrchestratorService);
      orchestrator.sendTeacherAssignmentNotification(centerId, createdTeacher._id.toString(), "subject", {
        name: "",
        info: payload.subjects.join(", "),
      }).catch(err => console.error("[TeacherNotification] Failed to send teacher subjects notification", err));
    }

    return { username, temporaryPassword: tempPassword };
  }

  async getTeachers(authUserId: string): Promise<TeacherResponseDTO[]> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    const teachers = await this._teacherRepository.findAll({ centerId, role: "teacher" });
    return teachers.map((teacher) => this.mapTeacher(teacher));
  }

  async getTeacherById(authUserId: string, teacherId: string): Promise<TeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }
    return this.mapTeacher(teacher);
  }

  async updateTeacherStatus(
    authUserId: string,
    teacherId: string,
    payload: UpdateTeacherStatusDTO
  ): Promise<TeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher update disabled.");

    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    const updated = await this._teacherRepository.update(teacherId, {
      status: payload.status,
    });
    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }
    return this.mapTeacher(updated);
  }

  async updateTeacher(
    authUserId: string,
    teacherId: string,
    payload: UpdateTeacherDTO
  ): Promise<TeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher update disabled.");

    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    const updated = await this._teacherRepository.update(teacherId, {
      name: payload.name ?? teacher.name,
      phone: payload.phone ?? teacher.phone,
      subjects: payload.subjects ?? teacher.subjects ?? [],
      salary: payload.salary ?? teacher.salary,
    });
    if (!updated) {
      throwError(MESSAGES.COMMON.SERVER_ERROR, StatusCode.INTERNAL_SERVER_ERROR);
    }

    const oldSubjects = teacher.subjects || [];
    const newSubjects = payload.subjects || [];
    const subjectsChanged = JSON.stringify([...oldSubjects].sort()) !== JSON.stringify([...newSubjects].sort());
    if (subjectsChanged && newSubjects.length > 0) {
      const orchestrator = container.resolve(NotificationOrchestratorService);
      orchestrator.sendTeacherAssignmentNotification(centerId, teacherId, "subject", {
        name: "",
        info: newSubjects.join(", "),
      }).catch(err => console.error("[TeacherNotification] Failed to send teacher subjects update notification", err));
    }

    return this.mapTeacher(updated);
  }

  async deleteTeacher(authUserId: string, teacherId: string): Promise<void> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher removal disabled.");

    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    await this._teacherRepository.delete(teacherId);
  }

  async resetTeacherPassword(authUserId: string, teacherId: string): Promise<CreateTeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Password reset disabled.");

    const teacher = await this._teacherRepository.findById(teacherId);
    if (!teacher) {
      throwError("Teacher not found", StatusCode.NOT_FOUND);
    }
    const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
    if (teacherCenter !== centerId || teacher.role !== "teacher") {
      throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await this._teacherRepository.update(teacherId, { password: hashedPassword });

    return { username: teacher.username, temporaryPassword: tempPassword };
  }

  // === Attendance ===

  async saveAttendance(
    authUserId: string,
    payload: CreateTeacherAttendanceDTO
  ): Promise<TeacherAttendanceRecordDTO> {
    const { centerId } = await this.getViewerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher attendance disabled.");
    await ensureTeacherInCenter(centerId, payload.teacherId, this._teacherRepository);
    return this._teacherAttendanceRepository.upsertAttendance(centerId, payload);
  }

  async getAttendance(
    authUserId: string,
    filters: TeacherAttendanceFiltersDTO
  ): Promise<TeacherAttendanceRecordDTO[]> {
    const { centerId } = await this.getViewerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher attendance disabled.");
    if (filters.teacherId) {
      await ensureTeacherInCenter(centerId, filters.teacherId, this._teacherRepository);
    }
    return this._teacherAttendanceRepository.getAttendance(centerId, filters);
  }

  // === Payments ===

  async createPayment(authUserId: string, payload: CreateTeacherPaymentDTO): Promise<TeacherPaymentRecordDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher payments disabled.");
    await ensureTeacherInCenter(centerId, payload.teacherId, this._teacherRepository);
    const payment = await this._teacherPaymentsRepository.createPayment(centerId, payload);
    
    // Send WhatsApp Alert
    this._notifications.sendTeacherPaymentAlert(
      centerId,
      payload.teacherId,
      payload.amount,
      payload.notes,
      authUserId
    ).catch(e => console.error("[TeacherPayment] Error sending WhatsApp alert", e));

    return payment;
  }

  async getPayments(
    authUserId: string,
    filters: TeacherPaymentFiltersDTO
  ): Promise<TeacherPaymentRecordDTO[]> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await ensureActiveSubscription(centerId, this._centerRepository, "Subscription inactive. Teacher payments disabled.");
    if (filters.teacherId) {
      await ensureTeacherInCenter(centerId, filters.teacherId, this._teacherRepository);
    }
    return this._teacherPaymentsRepository.getPayments(centerId, filters);
  }
}
