"use client";

import type { Batch } from "@/types/batches/batchTypes";

interface BatchCardProps {
  batch: Batch;
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
  onViewStudents: (batch: Batch) => void;
  onMarkAttendance: (batch: Batch) => void;
}

const formatDays = (days: string[]) => days.join(" ");

export default function BatchCard({
  batch,
  onEdit,
  onDelete,
  onViewStudents,
  onMarkAttendance,
}: BatchCardProps) {
  return (
    <div
      onClick={() => onMarkAttendance(batch)}
      className="cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{batch.batchName}</h3>
          <p className="text-xs text-muted-foreground">{batch.classLevel}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {batch.studentCount} Students
        </span>
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="text-foreground">{batch.medium} Medium</p>
        <p className="text-foreground">{batch.session} Session</p>
        <p>
          <span className="font-medium text-foreground">Schedule:</span> {batch.scheduleTime} |{" "}
          {formatDays(batch.days)}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onEdit(batch);
          }}
          className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
        >
          Edit
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(batch);
          }}
          className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
        >
          Delete
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onViewStudents(batch);
          }}
          className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
        >
          View Students
        </button>
      </div>
    </div>
  );
}
