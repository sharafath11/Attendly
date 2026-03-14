import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherAttendanceService } from "@/services/teacherAttendance.service";
import type {
  CreateTeacherAttendancePayload,
  TeacherAttendanceFilters,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

export const useTeacherAttendance = (filters?: TeacherAttendanceFilters) => {
  return useQuery({
    queryKey: ["teacherAttendance", filters],
    queryFn: () => teacherAttendanceService.getAttendance(filters),
    keepPreviousData: true,
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
