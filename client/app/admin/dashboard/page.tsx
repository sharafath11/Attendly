"use client";

import { useAdminDashboard, useAdminDashboardCharts } from "@/hooks/useAdmin";
import { AdminCharts, AdminDashboard } from "@/types/admin/adminTypes";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { exportToCsv } from "@/utils/exportToCsv";

export default function AdminDashboardPage() {
  const { data: dashboardRes } = useAdminDashboard();
  const { data: chartsRes } = useAdminDashboardCharts();

  const dashboard = (dashboardRes?.data ?? {}) as AdminDashboard;
  const charts = (chartsRes?.data ?? { revenueByMonth: [], centersGrowth: [] }) as AdminCharts;

  const cards = [
    { label: "Total Centers", value: dashboard.totalCenters ?? 0 },
    { label: "Active Centers", value: dashboard.activeCenters ?? 0 },
    { label: "Blocked Centers", value: dashboard.blockedCenters ?? 0 },
    { label: "Pending Centers", value: dashboard.pendingCenters ?? 0 },
    { label: "Total Students", value: dashboard.totalStudents ?? 0 },
    { label: "Total Teachers", value: dashboard.totalTeachers ?? 0 },
    { label: "Monthly Revenue", value: dashboard.monthlyRevenue ?? 0 },
  ];

  const handleDownloadCsv = () => {
    const summaryRows = cards.map((card) => ({
      Metric: card.label,
      Value: card.value,
    }));
    exportToCsv("admin-dashboard-summary", summaryRows);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground sm:text-base">Platform analytics and revenue overview.</p>
        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary sm:w-auto"
        >
          <Download className="h-3 w-3" />
          Download Excel (CSV)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-xl font-semibold sm:text-2xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold sm:text-base">Revenue Growth</h2>
          <div className="mt-4 h-56 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenueByMonth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold sm:text-base">Centers Growth</h2>
          <div className="mt-4 h-56 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.centersGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="centers" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
