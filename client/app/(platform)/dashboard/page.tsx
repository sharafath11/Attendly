"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, CalendarCheck2, WalletCards, Layers, Download } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DataTable from "@/components/dashboard/DataTable";
import ChartCard from "@/components/dashboard/ChartCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { exportToCsv } from "@/utils/exportToCsv";
import { useDashboard } from "@/hooks/useDashboard";
import type { DashboardData } from "@/types/dashboard/dashboardTypes";
import { useMemo, useState } from "react";

const emptyDashboard: DashboardData = {
  summary: {
    totalStudents: 0,
    todayAttendance: 0,
    pendingFees: 0,
    pendingFeesAmount: 0,
    totalBatches: 0,
  },
  attendanceChart: [],
  attendanceMonthlyChart: [],
  feeChart: [],
  recentAttendance: [],
  recentPayments: [],
  upcomingClasses: [],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export default function DashboardPage() {
  const { data: dashboardRes } = useDashboard();
  const dashboard = dashboardRes?.data ?? emptyDashboard;
  const [attendanceView, setAttendanceView] = useState<"weekly" | "monthly">("weekly");

  const attendanceRate = dashboard.summary.totalStudents
    ? Math.round((dashboard.summary.todayAttendance / dashboard.summary.totalStudents) * 100)
    : 0;

  const recentPayments = dashboard.recentPayments.map((payment) => ({
    ...payment,
    amount: formatCurrency(payment.amount),
    date: formatDate(payment.date),
  }));

  const attendanceChartData = attendanceView === "weekly"
    ? dashboard.attendanceChart
    : dashboard.attendanceMonthlyChart;

  const attendanceHasData = useMemo(
    () => attendanceChartData.some((point) => point.present > 0),
    [attendanceChartData]
  );

  const feeHasData = useMemo(
    () => dashboard.feeChart.some((point) => point.amount > 0),
    [dashboard.feeChart]
  );

  const handleDownloadDashboardCsv = () => {
    const summaryRows = [
      {
        Metric: "Total Students",
        Value: dashboard.summary.totalStudents,
      },
      {
        Metric: "Today Attendance",
        Value: dashboard.summary.todayAttendance,
      },
      {
        Metric: "Pending Fees",
        Value: dashboard.summary.pendingFees,
      },
      {
        Metric: "Pending Fees Amount",
        Value: formatCurrency(dashboard.summary.pendingFeesAmount),
      },
      {
        Metric: "Total Batches",
        Value: dashboard.summary.totalBatches,
      },
    ];

    exportToCsv("dashboard-summary", summaryRows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl lg:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Welcome back! Here is what is happening with your batches today.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadDashboardCsv}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary sm:w-auto"
        >
          <Download className="h-3 w-3" />
          Download Excel (CSV)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardCard
          title="Total Students"
          value={dashboard.summary.totalStudents}
          icon={<Users className="h-5 w-5" />}
          trend={`${dashboard.summary.totalStudents} enrolled`}
        />
        <DashboardCard
          title="Today&apos;s Attendance"
          value={dashboard.summary.todayAttendance}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          trend={dashboard.summary.totalStudents ? `${attendanceRate}% present today` : "No attendance yet"}
        />
        <DashboardCard
          title="Pending Fees"
          value={dashboard.summary.pendingFees}
          icon={<WalletCards className="h-5 w-5" />}
          trend={
            dashboard.summary.pendingFeesAmount
              ? `${formatCurrency(dashboard.summary.pendingFeesAmount)} pending`
              : dashboard.summary.pendingFees
                ? "Pending this month"
                : "All clear"
          }
        />
        <DashboardCard
          title="Total Batches"
          value={dashboard.summary.totalBatches}
          icon={<Layers className="h-5 w-5" />}
          trend={dashboard.summary.totalBatches ? "Active batches" : "No batches yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={attendanceView === "weekly" ? "Weekly Attendance" : "Monthly Attendance"}
          subtitle={attendanceView === "weekly" ? "Students present per day" : "Students present per month"}
        >
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {attendanceView}
            </span>
            <button
              type="button"
              onClick={() => setAttendanceView("weekly")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                attendanceView === "weekly"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setAttendanceView("monthly")}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                attendanceView === "monthly"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
          {attendanceHasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceChartData} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: "#6366F1", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No attendance data yet.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Fee Collections" subtitle="Last 6 months">
          {feeHasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.feeChart} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "#6366F1", opacity: 0.1 }} />
                <Bar dataKey="amount" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No fee data yet.
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Recent Attendance</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">Latest marked records</p>
          </div>
          <DataTable
            columns={[
              { key: "student", header: "Student" },
              { key: "batch", header: "Batch" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status as "Present" | "Absent" | "Leave"} />,
              },
            ]}
            data={dashboard.recentAttendance}
          />

          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Recent Fee Payments</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">Latest successful transactions</p>
          </div>
          <DataTable
            columns={[
              { key: "student", header: "Student" },
              { key: "amount", header: "Amount" },
              { key: "date", header: "Date" },
            ]}
            data={recentPayments}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Upcoming Classes</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Next 48 hours</p>
          <div className="mt-4 space-y-4">
            {dashboard.upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming classes scheduled.</p>
            ) : (
              dashboard.upcomingClasses.map((session) => (
                <div key={session.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
