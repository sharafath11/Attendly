"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { useExams, useExamMarks } from "@/hooks/useExams";
import { useBatch } from "@/hooks/useBatches";

export default function ExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params?.batchId as string;

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { data: batchData } = useBatch(batchId);
  const batch = batchData?.data;

  // Exams Data
  const { data: examsData, isLoading: isExamsLoading } = useExams({ batchId });
  const exams = examsData?.data || [];

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return exams.filter(
      (exam) => subjectFilter === "All Subjects" || exam.subject === subjectFilter
    );
  }, [exams, subjectFilter]);

  const uniqueSubjects = useMemo(() => {
    const subs = new Set(exams.map((e) => e.subject));
    return Array.from(subs);
  }, [exams]);

  // Marks Data (Only fetched if an exam is selected)
  const { data: marksData, isLoading: isMarksLoading } = useExamMarks(selectedExamId || "");
  const marks = marksData?.data || [];

  // Filtered & Sorted Marks
  const processedMarks = useMemo(() => {
    let result = [...marks];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.studentId?.name?.toLowerCase().includes(q) ||
          m.studentId?.parentName?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const marksA = a.marksObtained || 0;
      const marksB = b.marksObtained || 0;
      return sortOrder === "desc" ? marksB - marksA : marksA - marksB;
    });

    return result;
  }, [marks, searchQuery, sortOrder]);

  const selectedExam = exams.find((e) => e._id === selectedExamId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (selectedExamId) setSelectedExamId(null);
            else router.back();
          }}
          className="btn-tactile rounded-full p-2 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {selectedExamId ? "Exam Results" : "Exams"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {batch?.batchName || "Loading batch..."}
          </p>
        </div>
      </div>

      {!selectedExamId ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="input-interactive w-48 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
              >
                <option value="All Subjects">All Subjects</option>
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {isExamsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No exams found for this batch.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
                <div
                  key={exam._id}
                  onClick={() => setSelectedExamId(exam._id)}
                  className="interactive-card cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{exam.examName}</h3>
                      <p className="text-sm text-muted-foreground">{exam.subject}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      Out of {exam.totalMarks}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Conducted on {new Date(exam.date).toLocaleDateString()}
                    {exam.teacherId?.name && ` • by ${exam.teacherId.name}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="interactive-card rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">{selectedExam?.examName}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedExam?.subject} • Total Marks: {selectedExam?.totalMarks} • Date: {new Date(selectedExam?.date || "").toLocaleDateString()}
              {selectedExam?.teacherId?.name && ` • Teacher: ${selectedExam.teacherId.name}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-interactive w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                className="input-interactive w-48 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="desc">Sort by Marks (Highest First)</option>
                <option value="asc">Sort by Marks (Lowest First)</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            {isMarksLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading marks...</div>
            ) : processedMarks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No marks have been recorded for this exam yet.</div>
            ) : (
              <div className="scroll-guard">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Student Name</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Parent Details</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground text-center">Marks Obtained</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {processedMarks.map((mark) => (
                      <tr key={mark._id} className="table-row-interactive">
                        <td className="px-6 py-4 font-medium text-foreground">
                          {mark.studentId?.name}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">{mark.studentId?.parentName}</p>
                          <p className="text-xs text-muted-foreground">{mark.studentId?.parentPhone}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-primary">
                          {mark.marksObtained}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {mark.grade ? (
                            <span className="rounded bg-secondary px-2 py-1 text-xs font-bold uppercase">
                              {mark.grade}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
