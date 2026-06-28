"use client";

import type { Batch } from "@/types/batches/batchTypes";
import { cn } from "@/lib/utils";

interface BatchCardProps {
  batch: Batch;
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
  onViewStudents: (batch: Batch) => void;
  onMarkAttendance: (batch: Batch) => void;
  onAddExamMark: (batch: Batch) => void;
  onCreateExam?: (batch: Batch) => void;
  onViewExams: (batch: Batch) => void;
  actionsDisabled?: boolean;
  attendanceDisabled?: boolean;
  isOwner?: boolean;
}

const formatDays = (days: string[]) => days.join(" ");

const ActionButton = ({
  onClick,
  disabled,
  children,
  variant = "default",
}: {
  onClick: (event: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "btn-tactile rounded-lg border px-3 py-2 text-xs font-medium",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
      variant === "primary"
        ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_12px_var(--glow-primary)]"
        : "border-border text-muted-foreground hover:bg-[var(--btn-secondary-hover)] hover:border-[var(--card-hover-border)] hover:text-foreground",
    )}
  >
    {children}
  </button>
);

export default function BatchCard({
  batch,
  onEdit,
  onDelete,
  onViewStudents,
  onMarkAttendance,
  onAddExamMark,
  onCreateExam,
  onViewExams,
  actionsDisabled = false,
  attendanceDisabled = false,
  isOwner = false,
}: BatchCardProps) {
  return (
    <div
      onClick={() => {
        if (!attendanceDisabled) {
          onMarkAttendance(batch);
        }
      }}
      className={cn(
        "interactive-card rounded-xl border border-border bg-card p-5 shadow-sm",
        attendanceDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{batch.batchName}</h3>
          <p className="text-xs text-muted-foreground">{batch.classLevel}</p>
        </div>
        <span className="badge-interactive rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
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
      {/* Responsive button grid: wraps on mobile, inline on desktop */}
      <div className="mt-4 flex flex-wrap gap-2">
        {isOwner && (
          <>
            <ActionButton
              onClick={(event) => {
                event.stopPropagation();
                if (!actionsDisabled) {
                  onEdit(batch);
                }
              }}
              disabled={actionsDisabled}
            >
              Edit
            </ActionButton>
            <ActionButton
              onClick={(event) => {
                event.stopPropagation();
                if (!actionsDisabled) {
                  onDelete(batch);
                }
              }}
              disabled={actionsDisabled}
            >
              Delete
            </ActionButton>
          </>
        )}
        <ActionButton
          onClick={(event) => {
            event.stopPropagation();
            onViewStudents(batch);
          }}
        >
          View Students
        </ActionButton>

        {isOwner ? (
          <ActionButton
            onClick={(event) => {
              event.stopPropagation();
              if (!actionsDisabled && onCreateExam) {
                onCreateExam(batch);
              }
            }}
            disabled={actionsDisabled}
            variant="primary"
          >
            Create Exam
          </ActionButton>
        ) : (
          <ActionButton
            onClick={(event) => {
              event.stopPropagation();
              if (!actionsDisabled) {
                onAddExamMark(batch);
              }
            }}
            disabled={actionsDisabled}
            variant="primary"
          >
            Add Exam Mark
          </ActionButton>
        )}

        <ActionButton
          onClick={(event) => {
            event.stopPropagation();
            onViewExams(batch);
          }}
        >
          View Exams
        </ActionButton>
      </div>
    </div>
  );
}
