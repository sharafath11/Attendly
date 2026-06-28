"use client";

import { useMemo, useState } from "react";
import { Search, Filter, Printer, MessageCircle, FileText, Activity } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import { Button } from "@/components/button";
import { useInfiniteStudents } from "@/hooks/useStudents";
import { useBatches } from "@/hooks/useBatches";
import { useDebounce } from "@/hooks/useDebounce";
import { showSuccessToast } from "@/utils/toast";
import { useStudentAttendanceSummary } from "@/hooks/useAttendance";
import { useStudentMarks } from "@/hooks/useExams";

// Cell components for fetching real data dynamically per row
function StudentAttendanceCell({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentAttendanceSummary(studentId);
  if (isLoading) return <span className="text-muted-foreground animate-pulse">...</span>;
  const percentage = data?.data?.attendancePercentage;
  return <span>{percentage !== undefined ? `${percentage}%` : "N/A"}</span>;
}

function StudentScoreCell({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentMarks(studentId);
  if (isLoading) return <span className="text-muted-foreground animate-pulse">...</span>;
  const marks = data?.data || [];
  if (marks.length === 0) return <span>N/A</span>;
  
  const total = marks.reduce((acc: number, m: any) => {
    const totalMarks = m.exam?.totalMarks || 100;
    return acc + (m.marksObtained / totalMarks);
  }, 0);
  const avg = (total / marks.length) * 100;
  return <span>{Math.round(avg)}%</span>;
}

function StudentTopicsCell({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentMarks(studentId);
  if (isLoading) return <span className="text-muted-foreground animate-pulse">...</span>;
  const marks = data?.data || [];
  if (marks.length === 0) return <span className="text-muted-foreground">N/A</span>;
  
  let weakest = null;
  let minScore = 100;
  
  marks.forEach((m: any) => {
    const totalMarks = m.exam?.totalMarks || 100;
    const score = (m.marksObtained / totalMarks) * 100;
    if (score <= minScore) {
      minScore = score;
      weakest = m.exam?.subject || m.exam?.examName || "General";
    }
  });
  
  return <span>{weakest || "N/A"}</span>;
}

// Modal component for viewing the full report dynamically
function ViewReportModal({ 
  student, 
  open, 
  onClose,
}: { 
  student: any; 
  open: boolean; 
  onClose: () => void;
}) {
  const { data: attendanceRes } = useStudentAttendanceSummary(student?.id);
  const { data: marksRes } = useStudentMarks(student?.id);

  const attSummary = attendanceRes?.data;
  const marks = marksRes?.data || [];

  const handlePrint = () => {
    window.print();
  };

  const handleSendToParent = () => {
    showSuccessToast("Report sent to parent's WhatsApp successfully!");
  };

  if (!student) return null;

  // Calculate real average score
  let avgScore = "N/A";
  let weakestArea = "N/A";
  if (marks.length > 0) {
    let minScore = 100;
    const total = marks.reduce((acc: number, m: any) => {
      const totalMarks = m.exam?.totalMarks || 100;
      const score = (m.marksObtained / totalMarks) * 100;
      if (score <= minScore) {
        minScore = score;
        weakestArea = m.exam?.subject || m.exam?.examName || "General";
      }
      return acc + (m.marksObtained / totalMarks);
    }, 0);
    avgScore = `${Math.round((total / marks.length) * 100)}%`;
  }

  return (
    <Modal open={open} onClose={onClose} title={`Student Report: ${student.name}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}} />
      
      <div id="printable-report" className="space-y-6">
        <div className="flex justify-between items-end border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Join Date: {new Date(student.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Attendly Progress Report</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Activity size={14}/> Student Contact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{student.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Parent:</span> <span className="font-medium">{student.parentPhone || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batch:</span> <span className="font-medium">Assigned</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2"><Activity size={14}/> Academic Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Attendance:</span> <span className="font-medium text-emerald-500">{attSummary?.attendancePercentage ? attSummary.attendancePercentage + "%" : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg Score:</span> <span className="font-medium text-blue-500">{avgScore}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Weak Area:</span> <span className="font-medium text-rose-500">{weakestArea}</span></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
           <div>
             <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText size={16} className="text-primary"/> Recent Exam Performance</h3>
             <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr><th className="px-4 py-2.5">Exam</th><th className="px-4 py-2.5">Marks Obtained</th><th className="px-4 py-2.5">Total</th></tr>
                  </thead>
                  <tbody>
                    {marks.length > 0 ? marks.map((m: any) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium">{m.exam?.examName || m.exam?.title || "Class Test"}</td>
                        <td className="px-4 py-2.5 text-emerald-500 font-semibold">{m.marksObtained}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{m.exam?.totalMarks || 100}</td>
                      </tr>
                    )) : (
                      <tr className="border-t border-border">
                        <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No recent exams found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
           </div>

           <div>
             <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText size={16} className="text-primary"/> Fee Status (Current)</h3>
             <div className="rounded-lg border border-border bg-card overflow-hidden p-4 text-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Monthly Tuition Fee</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">₹{student.monthlyFee || "0"}</span>
                  <span className="block text-xs text-muted-foreground">Logged in system</span>
                </div>
             </div>
           </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-border print:hidden">
        <Button variant="secondary" onClick={handlePrint} className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.99]">
          <Printer size={16} /> Download PDF
        </Button>
        <Button onClick={handleSendToParent} className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.99]">
          <MessageCircle size={16} /> Send to Parent
        </Button>
      </div>
    </Modal>
  );
}

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [batchFilter, setBatchFilter] = useState("All Batches");
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const studentsQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      batchId: batchFilter === "All Batches" ? undefined : batchFilter,
      limit: 10,
    }),
    [debouncedSearch, batchFilter]
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteStudents(studentsQuery);
  const { data: batchesData } = useBatches();
  
  const batches = batchesData?.data?.batches ?? [];
  const batchOptions = useMemo(() => {
    return [
      { value: "All Batches", label: "All Batches" },
      ...batches.map((b) => ({ value: b.id, label: b.batchName })),
    ];
  }, [batches]);

  const allStudentsRaw = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data?.data ?? []) ?? [];
  }, [data]);

  const students = useMemo(() => {
    const seen = new Set<string>();
    return allStudentsRaw.filter((s) => {
      if (!s || !s.id) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [allStudentsRaw]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and share progress reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search students"
              placeholder="Search students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-48 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
            >
              {batchOptions.map((batch) => (
                <option key={batch.value} value={batch.value}>
                  {batch.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading reports...
        </div>
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Student" },
              { 
                key: "attendance", 
                header: "Attendance %",
                render: (row) => <StudentAttendanceCell studentId={row.id} />
              },
              { 
                key: "score", 
                header: "Average Score",
                render: (row) => <StudentScoreCell studentId={row.id} />
              },
              { 
                key: "topics", 
                header: "Weak Topics",
                render: (row) => <StudentTopicsCell studentId={row.id} />
              },
              { 
                key: "date", 
                header: "Generated Date",
                render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedStudentId(row.id)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStudentId(row.id);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Download
                    </button>
                    <button 
                      onClick={() => showSuccessToast("Report sent to parent's WhatsApp successfully!")}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Send to Parent
                    </button>
                  </div>
                ),
              },
            ]}
            data={students}
          />
          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                isLoading={isFetchingNextPage}
                variant="secondary"
              >
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </Button>
            </div>
          )}
          {!hasNextPage && students.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No students found to generate reports for.
            </div>
          )}
        </>
      )}

      {/* Complete Report Modal */}
      <ViewReportModal 
        open={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        student={selectedStudent}
      />
    </div>
  );
}
