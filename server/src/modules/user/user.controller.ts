import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IStudentsController } from "../../core/interfaces/controllers/IStudentsController";
import { IBatchesController } from "../../core/interfaces/controllers/IBatchesController";
import { IStudentsService } from "../../core/interfaces/services/IStudentsService";
import { IBatchesService } from "../../core/interfaces/services/IBatchesService";
import { TYPES } from "../../core/types";
import { handleControllerError, sendResponse } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";
import {
  validateCreateStudent,
  validateStudentsQuery,
  validateUpdateStudent,
} from "../../validator/students.validator";
import { validateBatchFilters, validateCreateBatch, validateUpdateBatch } from "../../validator/batches.validator";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "../../dtos/students/students.dto";
import { BatchFiltersDTO, CreateBatchDTO, UpdateBatchDTO } from "../../dtos/batches/batches.dto";
import { AuthenticatedRequest } from "../../shared/middleware/role.middleware";
import { getStringParam } from "../../utils/http";

@injectable()
export class UserController implements IStudentsController, IBatchesController {
  constructor(
    @inject(TYPES.IStudentsService) private _studentsService: IStudentsService,
    @inject(TYPES.IBatchesService) private _batchesService: IBatchesService
  ) {}

  // ==========================================
  // === Student Actions ===
  // ==========================================

  async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId, authUserId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as CreateStudentDTO;
      validateCreateStudent(payload);

      const student = await this._studentsService.createStudent(scopeId, payload, authUserId);
      sendResponse(res, StatusCode.CREATED, "Student created successfully", true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const query = validateStudentsQuery(req.query as unknown as StudentQueryDTO);
      const result = await this._studentsService.getStudents(scopeId, query);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const studentId = getStringParam(req.params.id);
      const student = await this._studentsService.getStudentById(scopeId, studentId as string);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as UpdateStudentDTO;
      validateUpdateStudent(payload);

      const studentId = getStringParam(req.params.id);
      const student = await this._studentsService.updateStudent(scopeId, studentId as string, payload);
      sendResponse(res, StatusCode.OK, "Student updated successfully", true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId, authUserId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const studentId = getStringParam(req.params.id);
      await this._studentsService.deleteStudent(scopeId, studentId as string, authUserId);
      sendResponse(res, StatusCode.OK, "Student deleted successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  // ==========================================
  // === Batch Actions ===
  // ==========================================

  async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateCreateBatch(req.body as CreateBatchDTO);
      const batch = await this._batchesService.createBatch(scopeId, payload);

      sendResponse(res, StatusCode.CREATED, "Batch created successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatches(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const filters = validateBatchFilters(req.query as unknown as BatchFiltersDTO);
      const result = await this._batchesService.getBatches(scopeId, filters);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const batchId = getStringParam(req.params.id);
      const batch = await this._batchesService.getBatchById(scopeId, batchId as string);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = validateUpdateBatch(req.body as UpdateBatchDTO);
      const batchId = getStringParam(req.params.id);
      const batch = await this._batchesService.updateBatch(scopeId, batchId as string, payload);
      sendResponse(res, StatusCode.OK, "Batch updated successfully", true, batch);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, userId } = req as AuthenticatedRequest;
      const scopeId = centerId ?? userId;
      if (!scopeId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const batchId = getStringParam(req.params.id);
      await this._batchesService.deleteBatch(scopeId, batchId as string);
      sendResponse(res, StatusCode.OK, "Batch deleted successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
