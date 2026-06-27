"use client";

import { useMemo, useState } from "react";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { useTeacherPayments } from "@/hooks/useTeacherPayments";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Wallet, CalendarDays, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TeacherDashboardStats() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: attendanceRes, isLoading: isAttLoading } = useTeacherAttendance({ teacherId: user?.id });
  const { data: paymentsRes, isLoading: isPayLoading } = useTeacherPayments({ teacherId: user?.id });

  const attendance = attendanceRes?.data || [];
  const payments = paymentsRes?.data || [];

  const { filteredAttendance, filteredPayments, stats, chartData } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    const filteredAtt = attendance.filter((att) => {
      const d = new Date(att.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const filteredPay = payments.filter((pay) => {
      if (!pay.month) return false;
      // pay.month is like "2026-06"
      return pay.month === selectedMonth;
    });

    const calculateHours = (att: any) => {
      if (att.checkInTime && att.checkOutTime) {
         const [inH, inM] = att.checkInTime.split(':').map(Number);
         const [outH, outM] = att.checkOutTime.split(':').map(Number);
         const inTime = inH + inM / 60;
         let outTime = outH + outM / 60;
         if (outTime < inTime) outTime += 24; // Handle overnight shifts
         const diff = outTime - inTime;
         return diff > 0 ? diff : 0;
      }
      if (att.status === "present") return 4; // Fallback to 4 hours per present day
      if (att.status === "half_day") return 2; // Fallback to 2 hours per half day
      return 0;
    };

    const totalDays = filteredAtt.length;
    const totalHoursRaw = filteredAtt.reduce((sum, a) => sum + calculateHours(a), 0);
    const totalHours = Math.round(totalHoursRaw * 10) / 10;
    const totalSalary = filteredPay.reduce((sum, p) => sum + p.amount, 0);
    const pendingSalary = filteredPay.reduce((sum, p) => sum + (p.status === "pending" ? p.amount : 0), 0);

    const sortedAtt = [...filteredAtt].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Aggregate by day for chart
    const chartMap = new Map<string, number>();
    sortedAtt.forEach((a) => {
      const day = new Date(a.date).getDate().toString();
      const h = calculateHours(a);
      chartMap.set(day, (chartMap.get(day) || 0) + h);
    });

    const cData = Array.from(chartMap.entries()).map(([day, hours]) => ({
      day: `Day ${day}`,
      hours: Math.round(hours * 10) / 10,
    }));

    return {
      filteredAttendance: filteredAtt,
      filteredPayments: filteredPay,
      stats: { totalDays, totalHours, totalSalary, pendingSalary },
      chartData: cData,
    };
  }, [attendance, payments, selectedMonth]);

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "long", year: "numeric" });
      options.push({ val, label });
    }
    return options;
  };

  if (isAttLoading || isPayLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl mt-6"></div>;
  }

  return (
    <div className="mt-8 space-y-6 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Session Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your attendance and earnings.</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-sm text-foreground shadow-sm focus:outline-none"
        >
          {generateMonthOptions().map((opt) => (
            <option key={opt.val} value={opt.val}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <CalendarDays className="h-5 w-5" />
            <h3 className="text-sm font-medium">Days Present</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalDays}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <h3 className="text-sm font-medium">Total Hours</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalHours}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <h3 className="text-sm font-medium">Total Salary</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">₹{stats.totalSalary.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <h3 className="text-sm font-medium">Pending Salary</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-500">₹{stats.pendingSalary.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-6">Hours Worked Trend</h3>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  cursor={{ stroke: "#888", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No attendance data for this month.
            </div>
          )}
        </div>
      </div>

      {/* Salary Details Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Salary Details</h3>
        {filteredPayments.length > 0 ? (
          <div className="space-y-4">
            {filteredPayments.map((payment, index) => (
              <div key={payment.id || index} className="flex flex-col sm:flex-row justify-between p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">₹{payment.amount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Credited on {new Date(payment.paidDate || payment.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </span>
                </div>
                <div className="mt-2 sm:mt-0 flex flex-col sm:items-end">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                    Paid
                  </span>
                  {payment.notes && (
                    <span className="text-xs text-muted-foreground mt-2 italic">{payment.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No salary records found for this month.
          </div>
        )}
      </div>
    </div>
  );
}
