"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parentApi } from "@/services/parent.api";
import { useParentContext } from "@/context/ParentContext";
import { IndianRupee, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ParentFeesPage() {
  const { selectedChildId, selectedChild, isLoading: contextLoading } = useParentContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-child-fees", selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return [];
      const res = await parentApi.getChildFees(selectedChildId);
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        _id: string;
        month: number;
        year: number;
        amount: number;
        status: string;
        paidDate: string | null;
      }[];
    },
    enabled: !!selectedChildId,
    retry: false,
  });

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm">
        <Link href="/parent/login" className="text-primary">
          Sign in
        </Link>{" "}
        to view fees.
      </p>
    );
  }

  if (!selectedChild || !data) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <IndianRupee className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Fee Ledger</h2>
          <p className="text-xs text-muted-foreground">{selectedChild.name}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-transparent px-4 py-8 text-center flex flex-col items-center">
          <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No fee records found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((row) => (
            <li key={row._id} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-sm uppercase tracking-wide">
                    {monthNames[row.month - 1]} {row.year}
                  </p>
                  {row.status === "Paid" && row.paidDate ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paid on {new Date(row.paidDate).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Due for {monthNames[row.month - 1]}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    row.status === "Paid"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className={`text-lg font-bold tabular-nums ${row.status === 'Paid' ? 'text-foreground' : 'text-amber-500'}`}>
                  {formatInr(row.amount)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
