import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
      </div>
      <div className="h-56 w-full sm:h-64 lg:h-72">{children}</div>
    </div>
  );
}
