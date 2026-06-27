import { ICenterRepository } from "../../core/interfaces/repository/ICenterRepository";
import { ITeacherRepository } from "../../core/interfaces/repository/ITeacherRepository";
import { throwError } from "../../utils/response";
import { StatusCode } from "../../enums/statusCode";
import { MESSAGES } from "../../const/messages";

export async function ensureActiveSubscription(
  centerId: string,
  centerRepository: ICenterRepository,
  message: string
): Promise<void> {
  const center = await centerRepository.findById(centerId);
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

export async function ensureTeacherInCenter(
  centerId: string,
  teacherId: string,
  teacherRepository: ITeacherRepository
): Promise<void> {
  const teacher = await teacherRepository.findById(teacherId);
  if (!teacher) {
    throwError("Teacher not found", StatusCode.NOT_FOUND);
  }
  const teacherCenter = teacher.centerId ? teacher.centerId.toString() : teacher._id.toString();
  if (teacherCenter !== centerId || teacher.role !== "teacher") {
    throwError(MESSAGES.COMMON.ACCESS_DENIED, StatusCode.FORBIDDEN);
  }
}
