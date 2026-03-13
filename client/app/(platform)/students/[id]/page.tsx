"use client";

import { useParams } from "next/navigation";
import { CalendarCheck2, UserCheck2, UserX2 } from "lucide-react";
import AttendanceSummaryCard from "@/components/attendance/AttendanceSummaryCard";
import { useStudent } from "@/hooks/useStudents";
import { useStudentAttendanceSummary } from "@/hooks/useAttendance";

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = typeof params?.id === "string" ? params.id : "";

  const { data: studentData } = useStudent(studentId);
  const { data: summaryData } = useStudentAttendanceSummary(studentId);

  const student = studentData?.data;
  const summary = summaryData?.data;

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
    </div>
  );
}
