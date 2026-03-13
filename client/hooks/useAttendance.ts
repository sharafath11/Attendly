import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance.service";
import type { CreateAttendancePayload } from "@/types/attendance/attendanceTypes";

export const useStudentAttendanceSummary = (studentId?: string) => {
  return useQuery({
    queryKey: ["attendance", "student-summary", studentId],
    queryFn: () => attendanceService.getStudentSummary(studentId as string),
    enabled: Boolean(studentId),
    keepPreviousData: true,
  });
};

export const useBatchAttendanceSummary = (batchId?: string) => {
  return useQuery({
    queryKey: ["attendance", "batch-summary", batchId],
    queryFn: () => attendanceService.getBatchSummary(batchId as string),
    enabled: Boolean(batchId),
    keepPreviousData: true,
  });
};

export const useLowAttendanceStudents = (batchId?: string) => {
  return useQuery({
    queryKey: ["attendance", "low-attendance", batchId],
    queryFn: () => attendanceService.getLowAttendance(batchId as string),
    enabled: Boolean(batchId),
    keepPreviousData: true,
  });
};

export const useAttendanceByDate = (batchId?: string, date?: string) => {
  return useQuery({
    queryKey: ["attendance", "by-date", batchId, date],
    queryFn: () => attendanceService.getAttendanceByDate(batchId as string, date as string),
    enabled: Boolean(batchId && date),
    keepPreviousData: true,
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
