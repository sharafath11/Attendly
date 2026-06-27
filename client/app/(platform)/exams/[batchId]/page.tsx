"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useInfiniteStudents } from "@/hooks/useStudents";
import { examsService } from "@/services/exams.service";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";

export default function ExamMarksPage() {
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const params = useParams();
  const batchId = params?.batchId as string;

  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState<string>("");
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  
  const [marksData, setMarksData] = useState<Record<string, { marksObtained: string; grade: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all students for this batch
  const { data, isLoading: isStudentsLoading, isError } = useInfiniteStudents({
    batchId,
    limit: 100,
  });

  const students = useMemo(() => {
    if (!data?.pages) return [];
    // Correctly mapping over page.data.data
    const all = data.pages.flatMap((page) => page?.data?.data || []);
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Fetch available exams for this batch
  useEffect(() => {
    async function fetchExams() {
      setIsLoadingExams(true);
      const res = await examsService.getExams({ batchId });
      if (res?.ok) {
        setExams(res.data);
      }
      setIsLoadingExams(false);
    }
    if (batchId) {
      fetchExams();
    }
  }, [batchId]);

  const selectedExam = useMemo(() => exams.find(e => e._id === examId), [exams, examId]);
  const totalMarks = selectedExam?.totalMarks || 100;

  // Pre-fill existing marks if any
  useEffect(() => {
    async function fetchExistingMarks() {
      if (!examId) return;
      const res = await examsService.getExamMarks(examId);
      if (res?.ok && res.data) {
        const newMarksData: Record<string, { marksObtained: string; grade: string }> = {};
        res.data.forEach((m: any) => {
          if (m.studentId?._id) {
            newMarksData[m.studentId._id] = {
              marksObtained: String(m.marksObtained),
              grade: m.grade || "",
            };
          }
        });
        setMarksData(newMarksData);
      }
    }
    fetchExistingMarks();
  }, [examId]);

  const handleMarkChange = (studentId: string, field: "marksObtained" | "grade", value: string) => {
    if (field === "marksObtained" && Number(value) > totalMarks) {
      showErrorToast(`Marks cannot exceed total marks (${totalMarks})`);
      return;
    }
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marksObtained: "", grade: "" }),
        [field]: value,
      },
    }));
  };

  const handleSubmitScores = async () => {
    if (!examId) return;

    const marksPayload = students
      .filter((s) => marksData[s.id]?.marksObtained !== undefined && marksData[s.id]?.marksObtained !== "")
      .map((s) => ({
        studentId: s.id,
        marksObtained: Number(marksData[s.id].marksObtained),
        grade: marksData[s.id].grade?.trim(),
      }));

    if (marksPayload.length === 0) {
      showErrorToast("Please enter marks for at least one student.");
      return;
    }

    setIsSubmitting(true);
    const res = await examsService.submitScores({
      examId,
      marks: marksPayload,
    });
    setIsSubmitting(false);

    if (res?.ok) {
      showSuccessToast(res.msg || "Marks submitted and parents notified via WhatsApp!");
      router.push("/batches");
    } else {
      showErrorToast(res?.msg || "Failed to submit marks.");
    }
  };

  if (isStudentsLoading || isLoadingExams) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load data.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Add Exam Marks</h1>
          <p className="text-sm text-muted-foreground">
            Select an existing exam and upload student scores.
          </p>
        </div>
      </div>

      {/* STEP 1: SELECT EXAM */}
      <div className={`rounded-xl border ${examId ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"} p-6 shadow-sm transition-colors`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Step 1: Select Exam</h2>
          {examId && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" /> Exam Selected
            </span>
          )}
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm text-muted-foreground sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Scheduled Exam
            </span>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Select an exam</option>
              {exams.length === 0 && <option value="" disabled>No exams scheduled for this batch</option>}
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.subject} - {exam.examName} (Out of {exam.totalMarks}) - {new Date(exam.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* STEP 2: MARKS ENTRY GRID */}
      {examId && selectedExam && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-xl border border-border bg-card shadow-sm">
          {isTeacher && String(selectedExam.teacherId?._id || selectedExam.teacherId) !== String(user?.id) ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-destructive mb-2">Unauthorized Access</h3>
              <p className="text-sm text-muted-foreground">
                This exam is assigned to {selectedExam.teacherId?.name || "another teacher"}. You can only add marks for exams assigned to you.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border bg-muted/30 px-6 py-4">
                <h2 className="text-lg font-medium">Step 2: Student Marks</h2>
                <p className="text-xs text-muted-foreground">Enter marks for each student. Limits are enforced based on the Total Marks ({totalMarks}).</p>
              </div>
          
          {students.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No students found in this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Student Name</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Marks Obtained</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Grade (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 font-medium text-foreground">
                        {student.name}
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          max={totalMarks || undefined}
                          className="w-24 rounded-md border border-border bg-input px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                          placeholder="Marks"
                          value={marksData[student.id]?.marksObtained || ""}
                          onChange={(e) => handleMarkChange(student.id, "marksObtained", e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          className="w-24 rounded-md border border-border bg-input px-3 py-1.5 text-sm uppercase focus:border-primary focus:outline-none"
                          placeholder="Grade"
                          maxLength={2}
                          value={marksData[student.id]?.grade || ""}
                          onChange={(e) => handleMarkChange(student.id, "grade", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <Button onClick={handleSubmitScores} isLoading={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" /> Submit Marks & Notify Parents
            </Button>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
