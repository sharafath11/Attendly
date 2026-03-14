import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacher.service";
import {
  CreateTeacherPayload,
  UpdateTeacherPayload,
  UpdateTeacherStatusPayload,
} from "@/types/teacher/teacherTypes";

export const useTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherService.getTeachers(),
    keepPreviousData: true,
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherPayload) => teacherService.createTeacher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeacherPayload }) =>
      teacherService.updateTeacher(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
};

export const useUpdateTeacherStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeacherStatusPayload }) =>
      teacherService.updateTeacherStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
};

export const useResetTeacherPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.resetTeacherPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
};
