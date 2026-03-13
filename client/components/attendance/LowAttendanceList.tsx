"use client";

import type { LowAttendanceStudent } from "@/types/attendance/attendanceTypes";

interface LowAttendanceListProps {
  students: LowAttendanceStudent[];
}

export default function LowAttendanceList({ students }: LowAttendanceListProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Low Attendance Alerts</h2>
      <p className="text-xs text-muted-foreground">Below 75% attendance</p>
      <div className="mt-4 space-y-3">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students below 75% in the last 30 days.</p>
        ) : (
          students.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{student.studentName}</p>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </div>
              <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">
                {student.attendancePercentage}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
