"use client";

import { useMemo, useState } from "react";
import DataTable from "@/components/dashboard/DataTable";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import type {
  TeacherAttendance,
  TeacherAttendanceStatus,
  TeacherShift,
} from "@/types/teacherAttendance/teacherAttendanceTypes";

const statusOptions: Array<TeacherAttendanceStatus | "all"> = ["all", "present", "absent", "half_day"];
const shiftOptions: Array<TeacherShift | "all"> = ["all", "morning", "afternoon", "evening", "night"];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendanceHistoryPage() {
  const { data: teachersData } = useTeachers();
  const teacherList = teachersData?.data ?? [];

  const [teacherFilter, setTeacherFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState<TeacherAttendanceStatus | "all">("all");
  const [shiftFilter, setShiftFilter] = useState<TeacherShift | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"date-desc" | "date-asc" | "name-asc" | "name-desc">(
    "date-desc"
  );

  const { data: historyData, isLoading } = useTeacherAttendance({
    teacherId: teacherFilter === "All" ? undefined : teacherFilter,
    dateFrom,
    dateTo,
  });
  const history = historyData?.data ?? [];

  const rows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = (history as TeacherAttendance[]).filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (shiftFilter !== "all" && row.shift !== shiftFilter) return false;
      if (!query) return true;
      const haystack = `${row.teacher?.name ?? ""} ${row.teacher?.username ?? ""} ${row.date}`
        .toLowerCase();
      return haystack.includes(query);
    });

    filtered = filtered.sort((a, b) => {
      if (sortOption === "name-asc") {
        return (a.teacher?.name ?? "").localeCompare(b.teacher?.name ?? "");
      }
      if (sortOption === "name-desc") {
        return (b.teacher?.name ?? "").localeCompare(a.teacher?.name ?? "");
      }
      if (sortOption === "date-asc") {
        return a.date.localeCompare(b.date);
      }
      return b.date.localeCompare(a.date);
    });

    return filtered;
  }, [history, searchQuery, statusFilter, shiftFilter, sortOption]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Teacher Attendance History</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and review attendance records.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={teacherFilter}
          onChange={(event) => setTeacherFilter(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Teachers</option>
          {teacherList.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TeacherAttendanceStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Status" : option.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={shiftFilter}
          onChange={(event) => setShiftFilter(event.target.value as TeacherShift | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {shiftOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Shifts" : option}
            </option>
          ))}
        </select>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by teacher or date"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:w-64"
        />
        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(event.target.value as "date-desc" | "date-asc" | "name-asc" | "name-desc")
          }
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="date-desc">Date Newest</option>
          <option value="date-asc">Date Oldest</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading history...
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "teacher",
              header: "Teacher",
              render: (row: TeacherAttendance) => row.teacher?.name ?? "—",
            },
            { key: "date", header: "Date" },
            {
              key: "status",
              header: "Status",
              render: (row: TeacherAttendance) => row.status.replace("_", " "),
            },
            { key: "shift", header: "Shift" },
            { key: "checkInTime", header: "Check In" },
            { key: "checkOutTime", header: "Check Out" },
          ]}
          data={rows}
        />
      )}
    </div>
  );
}
