"use client";

import type { Student } from "@/types/students/studentTypes";

interface AttendanceTableProps {
  students: Student[];
  attendance: Record<string, "Present" | "Absent">;
  onStatusChange: (studentId: string, status: "Present" | "Absent") => void;
  disabled?: boolean;
}

export default function AttendanceTable({
  students,
  attendance,
  onStatusChange,
  disabled = false,
}: AttendanceTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Student Attendance</h2>
      <div className="mt-4 space-y-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
          >
            <p className="text-sm font-medium text-foreground">{student.name}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`attendance-${student.id}`}
                  checked={attendance[student.id] === "Present"}
                  onChange={() => onStatusChange(student.id, "Present")}
                  disabled={disabled}
                  className="h-4 w-4 accent-emerald-500"
                />
                <span className="font-semibold text-emerald-500">Present</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`attendance-${student.id}`}
                  checked={attendance[student.id] === "Absent"}
                  onChange={() => onStatusChange(student.id, "Absent")}
                  disabled={disabled}
                  className="h-4 w-4 accent-rose-500"
                />
                <span className="font-semibold text-rose-500">Absent</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
