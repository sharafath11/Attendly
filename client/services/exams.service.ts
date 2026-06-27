import { postRequest, getRequest } from "@/services/api";

export interface CreateExamPayload {
  batchId: string;
  subject: string;
  teacherId: string;
  examName: string;
  totalMarks: number;
  date: string;
}

export interface SubmitScoresPayload {
  examId: string;
  marks: {
    studentId: string;
    marksObtained: number;
    grade?: string;
  }[];
}

export const examsService = {
  createExam: async (payload: CreateExamPayload) => {
    try {
      const response = await postRequest("/teacher/exams/create", payload);
      return response;
    } catch (error: any) {
      return {
        ok: false,
        msg: error.message || "Failed to create exam",
      };
    }
  },
  submitScores: async (payload: SubmitScoresPayload) => {
    try {
      const response = await postRequest("/teacher/exams/submit-scores", payload);
      return response;
    } catch (error: any) {
      return {
        ok: false,
        msg: error.message || "Failed to submit scores",
      };
    }
  },
  getExams: async (params?: { batchId?: string; subject?: string }) => {
    try {
      const response = await getRequest("/teacher/exams", params);
      return response;
    } catch (error: any) {
      return {
        ok: false,
        msg: error.message || "Failed to get exams",
      };
    }
  },
  getExamMarks: async (examId: string) => {
    try {
      const response = await getRequest(`/teacher/exams/${examId}/marks`);
      return response;
    } catch (error: any) {
      return {
        ok: false,
        msg: error.message || "Failed to get marks",
      };
    }
  },
  getStudentMarks: async (studentId: string) => {
    try {
      const response = await getRequest(`/teacher/students/${studentId}/marks`);
      return response;
    } catch (error: any) {
      return {
        ok: false,
        msg: error.message || "Failed to get student marks",
      };
    }
  },
};
