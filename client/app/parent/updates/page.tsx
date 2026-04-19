"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bell } from "lucide-react";
import { parentApi } from "@/services/parent.api";

const kindStyles: Record<string, string> = {
  fee_reminder: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  attendance_alert: "bg-primary/10 text-primary",
  broadcast: "bg-sky-500/10 text-sky-800 dark:text-sky-200",
  system: "bg-muted text-muted-foreground",
};

export default function ParentUpdatesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-notifications"],
    queryFn: async () => {
      const res = await parentApi.notifications();
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        id: string;
        type: string;
        channel: string;
        status: string;
        message: string;
        createdAt: string;
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
        to see messages.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <p className="text-sm text-muted-foreground">WhatsApp & email history we logged for you</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((u) => (
            <li key={u.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kindStyles[u.type] ?? kindStyles.system}`}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase text-muted-foreground">
                    {u.type.replace(/_/g, " ")} · {u.channel}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{u.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
