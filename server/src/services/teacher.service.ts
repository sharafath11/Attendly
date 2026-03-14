import { inject, injectable } from "tsyringe";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ITeacherService } from "../core/interfaces/services/ITeacherService";
import { ITeacherRepository } from "../core/interfaces/repository/ITeacherRepository";
import { ICenterRepository } from "../core/interfaces/repository/ICenterRepository";
import { TYPES } from "../core/types";
import {
  CreateTeacherDTO,
  CreateTeacherResponseDTO,
  TeacherResponseDTO,
  UpdateTeacherDTO,
  UpdateTeacherStatusDTO,
} from "../dtos/teacher/teacher.dto";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { MESSAGES } from "../const/messages";
import { IUser } from "../types/userTypes";

@injectable()
export class TeacherService implements ITeacherService {
  constructor(
    @inject(TYPES.ITeacherRepository)
    private _teacherRepository: ITeacherRepository,
    @inject(TYPES.ICenterRepository)
    private _centerRepository: ICenterRepository
  ) {}

  private mapTeacher(user: IUser): TeacherResponseDTO {
    return {
      id: user._id.toString(),
      name: user.name ?? user.username,
      username: user.username,
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
    };
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

  async createTeacher(authUserId: string, payload: CreateTeacherDTO): Promise<CreateTeacherResponseDTO> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher creation disabled.");

    const center = await this._centerRepository.findById(centerId);
    if (!center) {
      throwError("Center not found", StatusCode.NOT_FOUND);
    }

    const username = await this.generateTeacherUsername(center.name, centerId);
    const tempPassword = this.generateTempPassword();
    const email = `${username}@teacher.local`;

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await this._teacherRepository.create({
      name: payload.name,
      username,
      email,
      phone: payload.phone,
      subjects: payload.subjects ?? [],
      salary: payload.salary,
      password: hashedPassword,
      role: "teacher",
      centerId,
      status: "active",
      isVerified: true,
    });

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
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher update disabled.");

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
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher update disabled.");

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
    return this.mapTeacher(updated);
  }

  async deleteTeacher(authUserId: string, teacherId: string): Promise<void> {
    const { centerId } = await this.getOwnerAndCenter(authUserId);
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Teacher removal disabled.");

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
    await this.ensureActiveSubscription(centerId, "Subscription inactive. Password reset disabled.");

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
}
