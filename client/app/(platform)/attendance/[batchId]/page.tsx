"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/button";
import Modal from "@/components/dashboard/Modal";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useBatch } from "@/hooks/useBatches";
import { useStudents } from "@/hooks/useStudents";
import { useAttendanceByDate, useSaveAttendance } from "@/hooks/useAttendance";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
import { useTeachers } from "@/hooks/useTeachers";

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function BatchAttendancePage() {
  const { isActive } = useSubscription();
  const params = useParams();
  const batchId = typeof params?.batchId === "string" ? params.batchId : "";
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: batchData } = useBatch(batchId);
  const batch = batchData?.data;
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data ?? [];
  const teacherName = useMemo(() => {
    if (!batch?.teacherId) return "Unassigned";
    return (
      teachers.find((teacher) => teacher.id === batch.teacherId)?.name ||
      teachers.find((teacher) => teacher.id === batch.teacherId)?.username ||
      "Unknown"
    );
  }, [batch?.teacherId, teachers]);

  const studentsQuery = useMemo(
    () => ({
      batchId: batchId || undefined,
      page: 1,
      limit: 100,
    }),
    [batchId]
  );
  const { data: studentsData } = useStudents(studentsQuery);
  const students = studentsData?.data?.students ?? [];

  const { data: attendanceData } = useAttendanceByDate(batchId, selectedDate);
  const records = attendanceData?.data?.records ?? [];

  const saveAttendance = useSaveAttendance();

  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "leave">>({});
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (students.length === 0) return;
    const recordMap = new Map(records.map((record) => [record.studentId, record.status]));
    const next: Record<string, "present" | "absent" | "leave"> = {};
    students.forEach((student) => {
      next[student.id] = (recordMap.get(student.id) as "present" | "absent" | "leave") ?? "present";
    });
    setAttendance(next);
    setIsLocked(records.length > 0);
  }, [students, records]);

  const handleSave = async () => {
    if (!batchId) return;
    if (!selectedDate) {
      showErrorToast("Please select a date");
      return;
    }

    const payload = {
      batchId,
      date: selectedDate,
      records: students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] ?? "present",
      })),
    };

    const res = await saveAttendance.mutateAsync(payload);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to save attendance");
      return;
    }
    showSuccessToast(res.msg || "Attendance saved successfully");
    setIsLocked(true);
    setConfirmOpen(false);
  };

  const openConfirm = () => {
    if (!batchId) return;
    if (!selectedDate) {
      showErrorToast("Please select a date");
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            {batch?.batchName
              ? `${batch.batchName} • ${batch.session} • ${batch.classLevel} • Teacher: ${teacherName}`
              : "Batch attendance"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button onClick={openConfirm} isLoading={saveAttendance.isPending} disabled={!isActive}>
            Save Attendance
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsLocked(false)}
            disabled={!isLocked}
          >
            Edit Attendance
          </Button>
        </div>
      </div>

      <AttendanceTable
        students={students}
        attendance={attendance}
        onStatusChange={(studentId, status) =>
          setAttendance((prev) => ({ ...prev, [studentId]: status }))
        }
        disabled={isLocked}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Attendance"
      >
        <p className="text-sm text-muted-foreground">
          Save attendance for {selectedDate}? You can edit again by clicking "Edit Attendance".
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saveAttendance.isPending} disabled={!isActive}>
            Confirm Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
