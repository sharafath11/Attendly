"use client";

import type { ReactNode } from "react";
import DashboardCard from "@/components/dashboard/DashboardCard";

interface AttendanceSummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  suffix?: string;
  trend?: string;
}

export default function AttendanceSummaryCard({
  title,
  value,
  icon,
  suffix,
  trend,
}: AttendanceSummaryCardProps) {
  return <DashboardCard title={title} value={value} icon={icon} suffix={suffix} trend={trend} />;
}
