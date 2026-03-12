import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { IStudentsController } from "../../core/interfaces/controllers/IStudentsController";
import { IStudentsService } from "../../core/interfaces/services/IStudentsService";
import { TYPES } from "../../core/types";
import { handleControllerError, sendResponse } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";
import {
  validateCreateStudent,
  validateStudentsQuery,
  validateUpdateStudent,
} from "./students.validator";
import { CreateStudentDTO, StudentQueryDTO, UpdateStudentDTO } from "./students.dto";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@injectable()
export class StudentsController implements IStudentsController {
  constructor(
    @inject(TYPES.IStudentsService) private _studentsService: IStudentsService
  ) {}

  async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as CreateStudentDTO;
      validateCreateStudent(payload);

      const student = await this._studentsService.createStudent(userId, payload);
      sendResponse(res, StatusCode.CREATED, "Student created successfully", true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const query = validateStudentsQuery(req.query as unknown as StudentQueryDTO);
      const result = await this._studentsService.getStudents(userId, query);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, result);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const student = await this._studentsService.getStudentById(userId, req.params.id);
      sendResponse(res, StatusCode.OK, MESSAGES.COMMON.SUCCESS, true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      const payload = req.body as UpdateStudentDTO;
      validateUpdateStudent(payload);

      const student = await this._studentsService.updateStudent(userId, req.params.id, payload);
      sendResponse(res, StatusCode.OK, "Student updated successfully", true, student);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req as AuthenticatedRequest;
      if (!userId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, MESSAGES.AUTH.AUTH_REQUIRED, false);
      }

      await this._studentsService.deleteStudent(userId, req.params.id);
      sendResponse(res, StatusCode.OK, "Student deleted successfully", true);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
