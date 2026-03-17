import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "Paid" | "Pending" | "Overdue" | "Present" | "Absent" | "Leave";
}

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  Paid: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Overdue: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  Present: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Absent: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  Leave: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
