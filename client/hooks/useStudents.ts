import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "@/services/students.service";
import { CreateStudentPayload, StudentsQuery, UpdateStudentPayload } from "@/types/students/studentTypes";

export const useStudents = (params?: StudentsQuery) => {
  const search = params?.search ?? "";
  const batchId = params?.batchId ?? "";
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  return useQuery({
    queryKey: ["students", search, batchId, page, limit],
    queryFn: () => studentsService.getStudents(params),
    keepPreviousData: true,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => studentsService.createStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentPayload }) =>
      studentsService.updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
