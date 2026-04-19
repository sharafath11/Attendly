"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parentApi } from "@/services/parent.api";

export default function ParentAttendancePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-attendance"],
    queryFn: async () => {
      const res = await parentApi.attendance();
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        id: string;
        studentName: string;
        date: string;
        status: string;
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
        to view attendance.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Recent attendance</h2>
        <p className="text-sm text-muted-foreground">Last few classes</p>
      </div>
      <ul className="space-y-2">
        {data.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <div>
              <span className="text-sm text-foreground">{row.date}</span>
              <p className="text-xs text-muted-foreground">{row.studentName}</p>
            </div>
            <span
              className={
                row.status === "present"
                  ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                  : "rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300"
              }
            >
              {row.status === "present" ? "Present" : row.status === "leave" ? "Leave" : "Absent"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
