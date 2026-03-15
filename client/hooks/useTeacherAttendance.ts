import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherAttendanceService } from "@/services/teacherAttendance.service";
import type {
  ApiResponse,
  CreateTeacherAttendancePayload,
  TeacherAttendance,
  TeacherAttendanceFilters,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

export const useTeacherAttendance = (filters?: TeacherAttendanceFilters) => {
  return useQuery<ApiResponse<TeacherAttendance[]> | null>({
    queryKey: ["teacherAttendance", filters],
    queryFn: () => teacherAttendanceService.getAttendance(filters),
    placeholderData: keepPreviousData,
  });
};

export const useSaveTeacherAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherAttendancePayload) => teacherAttendanceService.saveAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAttendance"] });
    },
  });
};
