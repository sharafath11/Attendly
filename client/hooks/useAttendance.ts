import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import type {
  ApiResponse,
  AttendanceByDate,
  AttendanceHistoryFilters,
  AttendanceHistoryRecord,
  BatchAttendanceSummary,
  CreateAttendancePayload,
  LowAttendanceStudent,
  StudentAttendanceSummary,
} from "@/types/attendance/attendanceTypes";

export const useStudentAttendanceSummary = (studentId?: string) => {
  return useQuery<ApiResponse<StudentAttendanceSummary> | null>({
    queryKey: ["attendance", "student-summary", studentId],
    queryFn: () => attendanceService.getStudentSummary(studentId as string),
    enabled: Boolean(studentId),
    placeholderData: keepPreviousData,
  });
};

export const useBatchAttendanceSummary = (batchId?: string) => {
  return useQuery<ApiResponse<BatchAttendanceSummary> | null>({
    queryKey: ["attendance", "batch-summary", batchId],
    queryFn: () => attendanceService.getBatchSummary(batchId as string),
    enabled: Boolean(batchId),
    placeholderData: keepPreviousData,
  });
};

export const useLowAttendanceStudents = (batchId?: string) => {
  return useQuery<ApiResponse<LowAttendanceStudent[]> | null>({
    queryKey: ["attendance", "low-attendance", batchId],
    queryFn: () => attendanceService.getLowAttendance(batchId as string),
    enabled: Boolean(batchId),
    placeholderData: keepPreviousData,
  });
};

export const useAttendanceByDate = (batchId?: string, date?: string) => {
  return useQuery<ApiResponse<AttendanceByDate> | null>({
    queryKey: ["attendance", "by-date", batchId, date],
    queryFn: () => attendanceService.getAttendanceByDate(batchId as string, date as string),
    enabled: Boolean(batchId && date),
    placeholderData: keepPreviousData,
  });
};

export const useSaveAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAttendancePayload) => attendanceService.saveAttendance(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "by-date", variables.batchId, variables.date],
      });
    },
  });
};

export const useAttendanceHistory = (filters?: AttendanceHistoryFilters) => {
  return useQuery<ApiResponse<AttendanceHistoryRecord[]> | null>({
    queryKey: ["attendance", "history", filters],
    queryFn: () => attendanceService.getAttendanceHistory(filters),
    placeholderData: keepPreviousData,
  });
};
