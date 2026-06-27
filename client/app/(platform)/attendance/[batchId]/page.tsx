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

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function BatchAttendancePage() {
  const { isActive } = useSubscription();
  const params = useParams();
  const batchId = typeof params?.batchId === "string" ? params.batchId : "";
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: batchData } = useBatch(batchId);
  const batch = batchData?.data;
  const subjects: string[] = batch?.subjects ?? [];

  // Auto-select first subject when batch loads
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  const studentsQuery = useMemo(
    () => ({
      batchId: batchId || undefined,
      page: 1,
      limit: 100,
    }),
    [batchId]
  );
  const { data: studentsData } = useStudents(studentsQuery);
  const students = studentsData?.data?.data ?? [];

  // Fetch attendance filtered by subject (if batch has subjects)
  const subjectParam = subjects.length > 0 ? selectedSubject : undefined;
  const { data: attendanceData } = useAttendanceByDate(batchId, selectedDate, subjectParam);
  const records = attendanceData?.data?.records ?? [];

  const saveAttendance = useSaveAttendance();

  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "half_day" | "leave">>({});
  const [isLocked, setIsLocked] = useState(false);

  // Reset lock and populate from fetched records on date/subject change
  useEffect(() => {
    if (students.length === 0) return;
    const recordMap = new Map(records.map((record) => [record.studentId, record.status]));
    const next: Record<string, "present" | "absent" | "half_day" | "leave"> = {};
    students.forEach((student) => {
      next[student.id] = (recordMap.get(student.id) as "present" | "absent" | "half_day" | "leave") ?? "present";
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
    if (subjects.length > 0 && !selectedSubject) {
      showErrorToast("Please select a subject");
      return;
    }

    const payload = {
      batchId,
      date: selectedDate,
      subject: subjects.length > 0 ? selectedSubject : undefined,
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
    if (subjects.length > 0 && !selectedSubject) {
      showErrorToast("Please select a subject first");
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
              ? `${batch.batchName} • ${batch.session} • ${batch.classLevel}`
              : "Batch attendance"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setIsLocked(false);
              }}
              className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Subject picker — only shown if this batch has subjects configured */}
          {subjects.length > 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(event) => {
                  setSelectedSubject(event.target.value);
                  setIsLocked(false);
                }}
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 self-end">
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
      </div>

      {/* Subject badge when active */}
      {subjects.length > 0 && selectedSubject && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Marking for subject:</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {selectedSubject}
          </span>
          <span className="text-xs text-muted-foreground">on {selectedDate}</span>
        </div>
      )}

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
          Save attendance for <strong>{selectedDate}</strong>
          {subjects.length > 0 && selectedSubject && (
            <> — subject: <strong>{selectedSubject}</strong></>
          )}
          ? You can edit again by clicking &quot;Edit Attendance&quot;.
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
