"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { parentApi } from "@/services/parent.api";
export default function ParentHomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: async () => {
      const res = await parentApi.dashboard();
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        centerName: string;
        children: { id: string; name: string; monthlyFee: number }[];
        month: { month: number; year: number };
        pendingFees: { count: number; amount: number };
        attendanceRateLast30d: number;
      };
    },
    retry: false,
  });

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Sign in to see your child’s updates.</p>
        <Link
          href="/parent/login"
          className="inline-flex w-full max-w-xs items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Parent login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">{data.centerName}</p>
        {data.children.map((c) => (
          <div key={c.id} className="mt-2">
            <p className="text-xl font-semibold text-foreground">{c.name}</p>
            <p className="text-sm text-muted-foreground">Monthly fee ₹{c.monthlyFee}</p>
          </div>
        ))}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Last 30 days attendance rate: <strong>{data.attendanceRateLast30d}%</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Pending fees (this month)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{data.pendingFees.count}</p>
          <p className="text-xs text-muted-foreground">₹{data.pendingFees.amount}</p>
        </div>
        <Link
          href="/parent/fees"
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
        >
          <p className="text-xs font-medium text-muted-foreground">Fees</p>
          <p className="text-sm font-semibold text-foreground">Details</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
    </div>
  );
}
