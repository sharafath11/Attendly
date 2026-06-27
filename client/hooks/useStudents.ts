import { keepPreviousData, useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { studentsService } from "@/services/students.service";
import { ApiResponse, CreateStudentPayload, Student, StudentsListResponse, PaginatedStudentsResponse, StudentsQuery, UpdateStudentPayload } from "@/types/students/studentTypes";

export const useStudents = (params?: StudentsQuery) => {
  const search = params?.search ?? "";
  const batchId = params?.batchId ?? "";
  const session = params?.session ?? "";
  const cursor = params?.cursor ?? "";
  const sortBy = params?.sortBy ?? "createdAt";
  const sortOrder = params?.sortOrder ?? "desc";
  const limit = params?.limit ?? 10;

  return useQuery<ApiResponse<PaginatedStudentsResponse> | null>({
    queryKey: ["students", search, batchId, session, cursor, sortBy, sortOrder, limit],
    queryFn: () => studentsService.getStudents(params),
    placeholderData: keepPreviousData,
  });
};

export const useInfiniteStudents = (params?: StudentsQuery) => {
  const search = params?.search ?? "";
  const batchId = params?.batchId ?? "";
  const session = params?.session ?? "";
  const sortBy = params?.sortBy ?? "createdAt";
  const sortOrder = params?.sortOrder ?? "desc";
  const limit = params?.limit ?? 10;

  return useInfiniteQuery<ApiResponse<PaginatedStudentsResponse> | null>({
    queryKey: ["students", "infinite", search, batchId, session, sortBy, sortOrder, limit],
    queryFn: ({ pageParam }) =>
      studentsService.getStudents({
        ...params,
        cursor: pageParam as string | undefined,
        limit,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage?.data?.hasNextPage ? lastPage?.data?.nextCursor || undefined : undefined;
    },
  });
};

export const useStudent = (id?: string) => {
  return useQuery<ApiResponse<Student> | null>({
    queryKey: ["students", "detail", id],
    queryFn: () => studentsService.getStudentById(id as string),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
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
