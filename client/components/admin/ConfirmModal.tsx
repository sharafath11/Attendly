"use client";

import Modal from "@/components/dashboard/Modal";

type ConfirmTone = "default" | "warning" | "danger";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isLoading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonValue?: string;
  reasonError?: string;
  onReasonChange?: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

const toneClasses: Record<ConfirmTone, string> = {
  default: "border-border text-foreground hover:bg-secondary",
  warning: "border-amber-500/30 text-amber-600 hover:bg-amber-500/10",
  danger: "border-destructive/30 text-destructive hover:bg-destructive/10",
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isLoading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonValue = "",
  reasonError = "",
  onReasonChange,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground">{description}</p>
      {requireReason && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{reasonLabel}</label>
          <textarea
            value={reasonValue}
            onChange={(event) => onReasonChange?.(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
            rows={3}
            placeholder="Type the reason here..."
          />
          {reasonError && <p className="text-xs text-destructive">{reasonError}</p>}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="cursor-pointer rounded-md border border-border px-3 py-2 text-xs transition hover:bg-secondary"
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`cursor-pointer rounded-md border px-3 py-2 text-xs transition ${toneClasses[tone]}`}
          disabled={isLoading}
        >
          {isLoading ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
