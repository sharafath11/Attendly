"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/button";
import { useTeachers } from "@/hooks/useTeachers";
import { useSaveTeacherAttendance, useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type {
  TeacherAttendance,
  TeacherAttendanceStatus,
  TeacherShift,
} from "@/types/teacherAttendance/teacherAttendanceTypes";
import type { Teacher } from "@/types/teacher/teacherTypes";

const statusOptions: TeacherAttendanceStatus[] = ["present", "absent", "half_day"];
const shiftOptions: TeacherShift[] = ["morning", "afternoon", "evening", "night"];

type RowState = {
  id: string;
  teacher: Teacher;
  status: TeacherAttendanceStatus;
  shift?: TeacherShift;
  checkInTime?: string;
  checkOutTime?: string;
};

const toISODate = (value: Date) => value.toISOString().slice(0, 10);

export default function TeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc">("name-asc");
  const { data: teachersData, isLoading: teachersLoading } = useTeachers();
  const teacherList = teachersData?.data ?? [];

  const { data: attendanceData, isLoading: attendanceLoading } = useTeacherAttendance({
    date: selectedDate,
  });
  const attendanceList = attendanceData?.data ?? [];

  const saveAttendance = useSaveTeacherAttendance();

  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    const map = new Map<string, TeacherAttendance>();
    attendanceList.forEach((record) => map.set(record.teacherId, record));

    const nextRows = teacherList.map((teacher) => {
      const record = map.get(teacher.id);
      return {
        id: teacher.id,
        teacher,
        status: record?.status ?? "present",
        shift: record?.shift,
        checkInTime: record?.checkInTime,
        checkOutTime: record?.checkOutTime,
      };
    });
    setRows(nextRows);
  }, [teacherList, attendanceList, selectedDate]);

  const updateRow = (teacherId: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((row) => (row.teacher.id === teacherId ? { ...row, ...patch } : row))
    );
  };

  const handleSave = async (row: RowState) => {
    const payload = {
      teacherId: row.teacher.id,
      date: selectedDate,
      status: row.status,
      shift: row.shift,
      checkInTime: row.checkInTime || undefined,
      checkOutTime: row.checkOutTime || undefined,
    };

    const res = await saveAttendance.mutateAsync(payload);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to save attendance");
      return;
    }
    showSuccessToast(res.msg || "Attendance saved");
  };

  const loading = teachersLoading || attendanceLoading;

  const tableRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = rows.filter((row) => {
      if (!query) return true;
      const haystack = `${row.teacher.name} ${row.teacher.username} ${row.teacher.phone ?? ""}`
        .toLowerCase();
      return haystack.includes(query);
    });
    filtered = filtered.sort((a, b) => {
      if (sortOption === "name-desc") {
        return b.teacher.name.localeCompare(a.teacher.name);
      }
      return a.teacher.name.localeCompare(b.teacher.name);
    });
    return filtered;
  }, [rows, searchQuery, sortOption]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Teacher Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark shift, check-in and check-out times for teachers.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:w-auto sm:ml-auto">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full bg-transparent text-sm text-foreground focus-visible:outline-none sm:w-auto"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search teacher name or username"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:w-64"
        />
        <select
          value={sortOption}
          onChange={(event) => setSortOption(event.target.value as "name-asc" | "name-desc")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading attendance...
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "teacher",
              header: "Teacher",
              render: (row: RowState) => (
                <div>
                  <p className="text-sm font-medium text-foreground">{row.teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{row.teacher.username}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row: RowState) => (
                <select
                  value={row.status}
                  onChange={(event) =>
                    updateRow(row.teacher.id, { status: event.target.value as TeacherAttendanceStatus })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: "shift",
              header: "Shift",
              render: (row: RowState) => (
                <select
                  value={row.shift ?? ""}
                  onChange={(event) =>
                    updateRow(row.teacher.id, {
                      shift: event.target.value ? (event.target.value as TeacherShift) : undefined,
                    })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                >
                  <option value="">Select</option>
                  {shiftOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: "checkIn",
              header: "Check In",
              render: (row: RowState) => (
                <input
                  type="time"
                  value={row.checkInTime ?? ""}
                  onChange={(event) => updateRow(row.teacher.id, { checkInTime: event.target.value })}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                />
              ),
            },
            {
              key: "checkOut",
              header: "Check Out",
              render: (row: RowState) => (
                <input
                  type="time"
                  value={row.checkOutTime ?? ""}
                  onChange={(event) => updateRow(row.teacher.id, { checkOutTime: event.target.value })}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                />
              ),
            },
            {
              key: "actions",
              header: "Action",
              render: (row: RowState) => (
                <Button onClick={() => handleSave(row)} isLoading={saveAttendance.isPending} size="sm">
                  Save
                </Button>
              ),
            },
          ]}
          data={tableRows}
        />
      )}
    </div>
  );
}
