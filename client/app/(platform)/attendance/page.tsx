"use client";

import { useState } from "react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/button";

const batchOptions = ["Grade 10", "Grade 11", "Grade 12"];

const initialStudents = [
  { id: "1", name: "Aarav Kumar" },
  { id: "2", name: "Maya Singh" },
  { id: "3", name: "Rohan Patel" },
  { id: "4", name: "Zara Khan" },
];

export default function AttendancePage() {
  const [selectedBatch, setSelectedBatch] = useState(batchOptions[0]);
  const [attendance, setAttendance] = useState<Record<string, "Present" | "Absent">>({
    "1": "Present",
    "2": "Absent",
    "3": "Present",
    "4": "Present",
  });

  const presentCount = Object.values(attendance).filter((status) => status === "Present").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark and track today&apos;s attendance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedBatch}
            onChange={(event) => setSelectedBatch(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
          <Button>Mark Attendance</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Batch Selected</p>
            <p className="text-lg font-semibold text-foreground">{selectedBatch}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="Present" />
            <span className="text-sm text-muted-foreground">{presentCount} Present</span>
            <StatusBadge status="Absent" />
            <span className="text-sm text-muted-foreground">
              {initialStudents.length - presentCount} Absent
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Student List</h2>
        <div className="mt-4 space-y-3">
          {initialStudents.map((student) => (
            <div
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3"
            >
              <p className="text-sm font-medium text-foreground">{student.name}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setAttendance((prev) => ({ ...prev, [student.id]: "Present" }))
                  }
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    attendance[student.id] === "Present"
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: "Absent" }))}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    attendance[student.id] === "Absent"
                      ? "bg-rose-500/20 text-rose-500"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
