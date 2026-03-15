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
import { useQuery } from "@tanstack/react-query";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DataTable from "@/components/dashboard/DataTable";
import ChartCard from "@/components/dashboard/ChartCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import mockApi from "@/services/mockApi";
import { exportToCsv } from "@/utils/exportToCsv";

const attendanceData = [
  { day: "Mon", present: 48 },
  { day: "Tue", present: 52 },
  { day: "Wed", present: 44 },
  { day: "Thu", present: 56 },
  { day: "Fri", present: 50 },
  { day: "Sat", present: 38 },
];

const feeData = [
  { month: "Jan", amount: 12000 },
  { month: "Feb", amount: 15800 },
  { month: "Mar", amount: 14200 },
  { month: "Apr", amount: 17600 },
  { month: "May", amount: 16400 },
  { month: "Jun", amount: 18900 },
];

const recentAttendance = [
  { id: "1", student: "Aarav Kumar", batch: "Grade 10", status: "Present" },
  { id: "2", student: "Maya Singh", batch: "Grade 9", status: "Absent" },
  { id: "3", student: "Rohan Patel", batch: "Grade 11", status: "Present" },
  { id: "4", student: "Zara Khan", batch: "Grade 12", status: "Present" },
];

const recentPayments = [
  { id: "1", student: "Nila Thomas", amount: "₹2,400", date: "Mar 11" },
  { id: "2", student: "Aditya Das", amount: "₹3,200", date: "Mar 10" },
  { id: "3", student: "Sana Sheikh", amount: "₹2,800", date: "Mar 08" },
  { id: "4", student: "Kiran Rao", amount: "₹3,500", date: "Mar 06" },
];

const upcomingClasses = [
  { id: "1", name: "Grade 10 - Algebra", time: "Today, 4:00 PM" },
  { id: "2", name: "Grade 12 - Physics", time: "Tomorrow, 10:00 AM" },
  { id: "3", name: "Grade 9 - English", time: "Tomorrow, 3:00 PM" },
];

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      const response = await mockApi.get("/dashboard/summary");
      return response.data as {
        totalStudents: number;
        todayAttendance: number;
        pendingFees: number;
        totalBatches: number;
      };
    },
    initialData: {
      totalStudents: 186,
      todayAttendance: 142,
      pendingFees: 18,
      totalBatches: 12,
    },
  });

  const handleDownloadDashboardCsv = () => {
    const summaryRows = [
      {
        Metric: "Total Students",
        Value: data.totalStudents,
      },
      {
        Metric: "Today Attendance",
        Value: data.todayAttendance,
      },
      {
        Metric: "Pending Fees",
        Value: data.pendingFees,
      },
      {
        Metric: "Total Batches",
        Value: data.totalBatches,
      },
    ];

    exportToCsv("dashboard-summary", summaryRows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here is what is happening with your batches today.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadDashboardCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary"
        >
          <Download className="h-3 w-3" />
          Download Excel (CSV)
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Students"
          value={data.totalStudents}
          icon={<Users className="h-5 w-5" />}
          trend="+12 this month"
        />
        <DashboardCard
          title="Today&apos;s Attendance"
          value={data.todayAttendance}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          trend="93% present"
        />
        <DashboardCard
          title="Pending Fees"
          value={data.pendingFees}
          icon={<WalletCards className="h-5 w-5" />}
          trend="₹42,000 outstanding"
        />
        <DashboardCard
          title="Total Batches"
          value={data.totalBatches}
          icon={<Layers className="h-5 w-5" />}
          trend="3 new batches"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Weekly Attendance" subtitle="Students present per day">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceData} margin={{ left: -20, right: 10 }}>
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
        </ChartCard>

        <ChartCard title="Monthly Fee Collections" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feeData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#6366F1", opacity: 0.1 }} />
              <Bar dataKey="amount" fill="#22C55E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Attendance</h2>
            <p className="text-xs text-muted-foreground">Latest marked records</p>
          </div>
          <DataTable
            columns={[
              { key: "student", header: "Student" },
              { key: "batch", header: "Batch" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status as "Present" | "Absent"} />,
              },
            ]}
            data={recentAttendance}
          />

          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Fee Payments</h2>
            <p className="text-xs text-muted-foreground">Latest successful transactions</p>
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

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Classes</h2>
          <p className="text-xs text-muted-foreground">Next 48 hours</p>
          <div className="mt-4 space-y-4">
            {upcomingClasses.map((session) => (
              <div key={session.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{session.name}</p>
                <p className="text-xs text-muted-foreground">{session.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
