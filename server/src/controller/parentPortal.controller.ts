import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { ParentLinkModel } from "../models/parentLink.model";
import { StudentModel } from "../models/students.model";
import { FeeModel } from "../models/fees.model";
import { AttendanceModel } from "../models/attendance.model";
import { ParentNotificationModel } from "../models/parentNotification.model";
import { ExamModel } from "../models/exam.model";
import { MarkModel } from "../models/mark.model";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

export class ParentPortalController {
  /**
   * Fetches all children (students) linked to the logged-in parent.
   */
  async getMyChildren(req: any, res: Response, next: NextFunction) {
    try {
      const parentPhone = req.parentPhone;
      const centerId = req.parentCenterId;
      
      if (!parentPhone || !centerId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
      }

      // Find student profiles by phone and centerId
      const students = await StudentModel.find({
        parentPhone: { $regex: `${parentPhone}$` },
        centerId,
        isDeleted: false,
      })
        .populate("batchId", "batchName session")
        .lean()
        .exec();

      return sendResponse(res, StatusCode.OK, "Children list fetched successfully", true, students);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches fee logs for a specific child after ensuring deep multi-tenant/relationship security.
   */
  async getChildFees(req: any, res: Response, next: NextFunction) {
    try {
      const parentPhone = req.parentPhone;
      const centerId = req.parentCenterId;
      const { studentId } = req.params;

      if (!parentPhone || !centerId || !studentId) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing parameters", false);
      }

      // 1. Deep security validation: Check parent-student relationship
      const relationshipExists = await StudentModel.findOne({
        _id: studentId,
        centerId,
        parentPhone: { $regex: `${parentPhone}$` },
        isDeleted: false
      })
        .lean()
        .exec();

      if (!relationshipExists) {
        return sendResponse(
          res,
          StatusCode.FORBIDDEN,
          "Access Denied - You are not authorized to view this student's records.",
          false
        );
      }

      // 2. Fetch fees with strict tenant bound
      const fees = await FeeModel.find({ studentId, centerId })
        .sort({ year: -1, month: -1 })
        .lean()
        .exec();

      return sendResponse(res, StatusCode.OK, "Child fee records fetched successfully", true, fees);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches attendance history for a specific child after validation.
   */
  async getChildAttendance(req: any, res: Response, next: NextFunction) {
    try {
      const parentPhone = req.parentPhone;
      const centerId = req.parentCenterId;
      const { studentId } = req.params;

      if (!parentPhone || !centerId || !studentId) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing parameters", false);
      }

      // 1. Relationship authorization guard
      const relationshipExists = await StudentModel.findOne({
        _id: studentId,
        centerId,
        parentPhone: { $regex: `${parentPhone}$` },
        isDeleted: false
      })
        .lean()
        .exec();

      if (!relationshipExists) {
        return sendResponse(
          res,
          StatusCode.FORBIDDEN,
          "Access Denied - You are not authorized to view this student's records.",
          false
        );
      }

      // 2. Fetch attendance history with strict tenant bound
      const attendance = await AttendanceModel.find({ studentId, centerId })
        .sort({ date: -1 })
        .lean()
        .exec();

      return sendResponse(
        res,
        StatusCode.OK,
        "Child attendance history fetched successfully",
        true,
        attendance
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches progress/monthly reports for a specific child.
   */
  async getChildReports(req: any, res: Response, next: NextFunction) {
    try {
      const parentPhone = req.parentPhone;
      const centerId = req.parentCenterId;
      const { studentId } = req.params;

      if (!parentPhone || !centerId || !studentId) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing parameters", false);
      }

      // 1. Relationship authorization guard
      const relationshipExists = await StudentModel.findOne({
        _id: studentId,
        centerId,
        parentPhone: { $regex: `${parentPhone}$` },
        isDeleted: false
      })
        .lean()
        .exec();

      if (!relationshipExists) {
        return sendResponse(
          res,
          StatusCode.FORBIDDEN,
          "Access Denied - You are not authorized to view this student's records.",
          false
        );
      }

      // Dynamically summarize reports/performance from attendance and fees status with strict tenant bounds
      const [attendance, fees] = await Promise.all([
        AttendanceModel.find({ studentId, centerId }).lean().exec(),
        FeeModel.find({ studentId, centerId }).lean().exec(),
      ]);

      const totalClasses = attendance.length;
      const presentClasses = attendance.filter((a) => a.status === "present").length;
      const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

      const pendingFeesCount = fees.filter((f) => f.status === "Pending" || f.status === "Overdue").length;

      const summaryReport = {
        studentId,
        attendanceSummary: {
          totalClasses,
          presentClasses,
          attendanceRate,
        },
        feesSummary: {
          pendingFeesCount,
          status: pendingFeesCount > 0 ? "Outstanding Fees" : "All Paid",
        },
        generatedAt: new Date(),
      };

      return sendResponse(
        res,
        StatusCode.OK,
        "Child progress report summarized successfully",
        true,
        summaryReport
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches parent inbox notification logs.
   */
  async getMyNotifications(req: any, res: Response, next: NextFunction) {
    try {
      const parentUserId = req.parentUserId || req.authUserId;
      if (!parentUserId) {
        return sendResponse(res, StatusCode.UNAUTHORIZED, "Authentication required", false);
      }

      const notifications = await ParentNotificationModel.find({ parentUserId })
        .populate("studentId", "name")
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return sendResponse(res, StatusCode.OK, "Inbox notifications fetched successfully", true, notifications);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches read-only exam marks for a specific child
   */
  async getChildExams(req: any, res: Response, next: NextFunction) {
    try {
      const parentPhone = req.parentPhone;
      const centerId = req.parentCenterId;
      const studentId = req.params.studentId;

      if (!parentPhone || !centerId || !studentId) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing identifiers", false);
      }

      // Security check: validate that student belongs to parent
      const parentLink = await StudentModel.findOne({
        _id: studentId,
        centerId,
        parentPhone: { $regex: `${parentPhone}$` },
        isDeleted: false
      })
        .lean()
        .exec();

      if (!parentLink) {
        return sendResponse(
          res,
          StatusCode.FORBIDDEN,
          "Access Denied - You are not authorized to view this student's records.",
          false
        );
      }

      // Fetch student marks and populate exam details strictly bound to tenant
      const studentMarks = await MarkModel.find({ studentId, centerId })
        .populate({
          path: "examId",
          select: "examName subject totalMarks date",
        })
        .lean()
        .exec();

      const reportCard = studentMarks.map((mark: any) => ({
        _id: mark._id,
        examName: mark.examId?.examName,
        subject: mark.examId?.subject,
        date: mark.examId?.date,
        totalMarks: mark.examId?.totalMarks,
        marksObtained: mark.marksObtained,
      }));

      return sendResponse(res, StatusCode.OK, "Child exams fetched successfully", true, reportCard);
    } catch (err) {
      next(err);
    }
  }
}
