"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, GraduationCap, Calendar, IndianRupee } from "lucide-react";
import { parentApi } from "@/services/parent.api";
import { useParentContext } from "@/context/ParentContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentHomePage() {
  const { selectedChildId, selectedChild, isLoading: contextLoading } = useParentContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-child-report", selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return null;
      const res = await parentApi.getChildReports(selectedChildId);
      if (!res?.ok) throw new Error("unauthorized");
      return res.data;
    },
    enabled: !!selectedChildId,
    retry: false,
  });

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
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

  if (!selectedChild || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No Students Linked</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-[250px]">
          There are no students linked to your mobile number. Please contact the center administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <GraduationCap className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Student Profile</p>
          <div className="mt-2">
            <h2 className="text-2xl font-bold text-foreground">{selectedChild.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {selectedChild.batchId?.batchName || "No Batch"}
              </span>
              <span>{selectedChild.batchId?.session || ""}</span>
            </div>
          </div>
          
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              Overall Attendance: <strong>{data.attendanceSummary?.attendanceRate ?? 0}%</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/parent/attendance"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Attendance</p>
            <div className="p-1.5 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl font-bold tabular-nums text-foreground">
              {data.attendanceSummary?.presentClasses}/{data.attendanceSummary?.totalClasses}
            </p>
            <p className="text-xs text-muted-foreground">Days Present</p>
          </div>
        </Link>
        
        <Link
          href="/parent/fees"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Fee Status</p>
            <div className={`p-1.5 rounded-full ${data.feesSummary?.pendingFeesCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-xl font-bold tabular-nums ${data.feesSummary?.pendingFeesCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {data.feesSummary?.pendingFeesCount > 0 ? `${data.feesSummary.pendingFeesCount} Dues` : 'All Paid'}
            </p>
            <p className="text-xs text-muted-foreground">Pending invoices</p>
          </div>
        </Link>
      </div>

      <Link
        href="/parent/updates"
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Academic Inbox</p>
          <p className="text-xs text-muted-foreground">View remarks and announcements</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          Open <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </div>
  );
}
