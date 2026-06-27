"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parentApi } from "@/services/parent.api";
import { useParentContext } from "@/context/ParentContext";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentAttendancePage() {
  const { selectedChildId, selectedChild, isLoading: contextLoading } = useParentContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-child-attendance", selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return [];
      const res = await parentApi.getChildAttendance(selectedChildId);
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        _id: string;
        date: string;
        status: string;
      }[];
    },
    enabled: !!selectedChildId,
    retry: false,
  });

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm">
        <Link href="/parent/login" className="text-primary">
          Sign in
        </Link>{" "}
        to view attendance.
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
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Attendance History</h2>
          <p className="text-xs text-muted-foreground">{selectedChild.name}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-transparent px-4 py-8 text-center text-sm text-muted-foreground">
          No attendance records found.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li
              key={row._id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/30"
            >
              <div>
                <span className="text-sm font-medium text-foreground">
                  {new Date(row.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  row.status === "present"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : row.status === "leave"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                    : row.status === "half_day"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                }`}
              >
                {row.status === "present" ? "Present" : row.status === "leave" ? "Leave" : row.status === "half_day" ? "Half Day" : "Absent"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

