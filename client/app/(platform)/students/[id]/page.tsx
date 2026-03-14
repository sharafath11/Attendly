"use client";

import { useParams } from "next/navigation";
import { CalendarCheck2, UserCheck2, UserX2 } from "lucide-react";
import AttendanceSummaryCard from "@/components/attendance/AttendanceSummaryCard";
import DataTable from "@/components/dashboard/DataTable";
import { useStudent } from "@/hooks/useStudents";
import { useAttendanceHistory, useStudentAttendanceSummary } from "@/hooks/useAttendance";
import { useState } from "react";
import type { AttendanceHistoryRecord } from "@/types/attendance/attendanceTypes";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const { data: studentData } = useStudent(studentId);
  const { data: summaryData } = useStudentAttendanceSummary(studentId);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"all" | "present" | "absent" | "leave">("all");
  const [historySort, setHistorySort] = useState<"date-desc" | "date-asc">("date-desc");
  const { data: historyData, isLoading: historyLoading } = useAttendanceHistory({
    studentId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const student = studentData?.data;
  const summary = summaryData?.data;
  const history = (historyData?.data ?? []) as AttendanceHistoryRecord[];

  const filteredHistory = history
    .filter((row) => {
      if (historyStatus !== "all" && row.status !== historyStatus) return false;
      if (!historySearch.trim()) return true;
      const haystack = `${row.date} ${row.batch?.batchName ?? ""} ${row.marker?.name ?? ""}`.toLowerCase();
      return haystack.includes(historySearch.trim().toLowerCase());
    })
    .sort((a, b) =>
      historySort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Student Profile</h1>
        <p className="text-sm text-muted-foreground">
          {student?.name ? `${student.name}'s attendance overview.` : "Attendance overview."}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Student Details</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium text-foreground">{student?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{student?.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Parent Phone</p>
            <p className="text-sm font-medium text-foreground">{student?.parentPhone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Join Date</p>
            <p className="text-sm font-medium text-foreground">
              {student?.joinDate ? new Date(student.joinDate).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceSummaryCard
          title="Attendance %"
          value={summary?.attendancePercentage ?? 0}
          suffix="%"
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
        <AttendanceSummaryCard
          title="Total Classes"
          value={summary?.totalClasses ?? 0}
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
        <AttendanceSummaryCard
          title="Present"
          value={summary?.present ?? 0}
          icon={<UserCheck2 className="h-5 w-5" />}
        />
        <AttendanceSummaryCard
          title="Absent"
          value={summary?.absent ?? 0}
          icon={<UserX2 className="h-5 w-5" />}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Attendance History</h2>
            <p className="text-sm text-muted-foreground">All attendance records for this student.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
            <select
              value={historyStatus}
              onChange={(event) =>
                setHistoryStatus(event.target.value as "all" | "present" | "absent" | "leave")
              }
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
            <select
              value={historySort}
              onChange={(event) => setHistorySort(event.target.value as "date-desc" | "date-asc")}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
            </select>
            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search batch or marker"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground sm:w-56"
            />
          </div>
        </div>

        <div className="mt-4">
          {historyLoading ? (
            <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              Loading history...
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "date", header: "Date" },
                {
                  key: "status",
                  header: "Status",
                  render: (row: AttendanceHistoryRecord) => row.status,
                },
                {
                  key: "batch",
                  header: "Batch",
                  render: (row: AttendanceHistoryRecord) => row.batch?.batchName ?? "—",
                },
                {
                  key: "markedBy",
                  header: "Marked By",
                  render: (row: AttendanceHistoryRecord) => row.marker?.name ?? "—",
                },
              ]}
              data={filteredHistory}
              className="border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
