"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function DashboardCard({
  title,
  value,
  icon,
  trend,
  className,
  prefix,
  suffix,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {trend && <p className="mt-3 text-xs text-muted-foreground">{trend}</p>}
    </div>
  );
}
