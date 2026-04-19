"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parentApi } from "@/services/parent.api";

const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ParentFeesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-fees"],
    queryFn: async () => {
      const res = await parentApi.fees();
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        id: string;
        studentName: string;
        batchName: string;
        month: number;
        year: number;
        amount: number;
        status: string;
        paidDate: string | null;
      }[];
    },
    retry: false,
  });

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) {
    return (
      <p className="py-8 text-center text-sm">
        <Link href="/parent/login" className="text-primary">
          Sign in
        </Link>{" "}
        to view fees.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Fee records</h2>
        <p className="text-sm text-muted-foreground">From your center</p>
      </div>
      <ul className="space-y-3">
        {data.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{row.studentName}</p>
                <p className="text-xs text-muted-foreground">{row.batchName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.month}/{row.year}
                </p>
              </div>
              <span
                className={
                  row.status === "Paid"
                    ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    : "rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200"
                }
              >
                {row.status}
              </span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">{formatInr(row.amount)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
