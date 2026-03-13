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
import ChartCard from "@/components/dashboard/ChartCard";
import type { AttendanceTrendPoint } from "@/types/attendance/attendanceTypes";

interface BatchAttendanceChartProps {
  dailyTrend: AttendanceTrendPoint[];
  monthlyTrend: AttendanceTrendPoint[];
}

export default function BatchAttendanceChart({
  dailyTrend,
  monthlyTrend,
}: BatchAttendanceChartProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="Attendance Trend" subtitle="Last 30 days">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyTrend} margin={{ left: -20, right: 10 }}>
            <defs>
              <linearGradient id="attendanceTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip cursor={{ stroke: "#10B981", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="attendancePercentage"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#attendanceTrendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Attendance" subtitle="Last 6 months">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyTrend} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#10B981", opacity: 0.1 }} />
            <Bar dataKey="attendancePercentage" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
