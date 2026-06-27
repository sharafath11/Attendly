"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, IndianRupee, WalletCards, ArrowRight } from "lucide-react";
import { useCompanyAnalytics } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CompanyAnalyticsPage() {
  const router = useRouter();
  const { data: analyticsRes, isLoading, isError } = useCompanyAnalytics();
  const data = analyticsRes?.data;

  const chartData = useMemo(() => {
    if (!data?.chartData) return [];
    return data.chartData;
  }, [data]);

  const totalRevenue = data?.totalRevenue || 0;
  const totalPayments = data?.totalTeacherPayments || 0;
  const totalProfit = data?.totalProfit || 0;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load analytics.</div>;
  }

  const isProfitable = totalProfit >= 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Company Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Financial overview of your center.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-foreground">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">From student fees</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <WalletCards className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-foreground">Total Paid</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalPayments)}</p>
          <p className="text-xs text-muted-foreground">To teachers</p>
        </div>

        <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${isProfitable ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
          <div className="mb-2 flex items-center gap-2">
            <div className={`rounded-lg p-2 ${isProfitable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-foreground">Net Profit</h3>
          </div>
          <p className={`text-2xl font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(totalProfit)}
          </p>
          <p className="text-xs text-muted-foreground">{isProfitable ? 'You are in profit' : 'Operating at a loss'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Revenue vs Teacher Payments (This Year)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip
                cursor={{ fill: '#333' }}
                contentStyle={{ backgroundColor: '#121214', borderColor: '#232326', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" name="Revenue (Fees)" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payments" name="Teacher Payments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
