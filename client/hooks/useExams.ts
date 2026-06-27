import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { examsService } from "@/services/exams.service";

export const useExams = (params?: { batchId?: string; subject?: string }) => {
  return useQuery({
    queryKey: ["exams", params?.batchId, params?.subject],
    queryFn: () => examsService.getExams(params),
    placeholderData: keepPreviousData,
  });
};

export const useExamMarks = (examId: string) => {
  return useQuery({
    queryKey: ["examMarks", examId],
    queryFn: () => examsService.getExamMarks(examId),
    enabled: Boolean(examId),
    placeholderData: keepPreviousData,
  });
};

export const useStudentMarks = (studentId: string) => {
  return useQuery({
    queryKey: ["studentMarks", studentId],
    queryFn: () => examsService.getStudentMarks(studentId),
    enabled: Boolean(studentId),
    placeholderData: keepPreviousData,
  });
};
