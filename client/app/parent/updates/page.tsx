"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bell, MessageSquare, AlertCircle, Info } from "lucide-react";
import { parentApi } from "@/services/parent.api";
import { useParentContext } from "@/context/ParentContext";
import { Skeleton } from "@/components/ui/skeleton";

const kindStyles: Record<string, string> = {
  fee_reminder: "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/50",
  attendance_alert: "bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/50",
  broadcast: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/50",
  system: "bg-secondary text-secondary-foreground border-border",
};

const kindIcons: Record<string, React.ReactNode> = {
  fee_reminder: <AlertCircle className="h-5 w-5" />,
  attendance_alert: <AlertCircle className="h-5 w-5" />,
  broadcast: <MessageSquare className="h-5 w-5" />,
  system: <Info className="h-5 w-5" />,
};

export default function ParentUpdatesPage() {
  const { isLoading: contextLoading } = useParentContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-inbox"],
    queryFn: async () => {
      const res = await parentApi.getMyNotifications();
      if (!res?.ok) throw new Error("unauthorized");
      return res.data as {
        _id: string;
        type: string;
        channel: string;
        status: string;
        message: string;
        studentId?: { name: string };
        createdAt: string;
      }[];
    },
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
        <Link href="/parent/login" className="text-primary hover:underline">
          Sign in
        </Link>{" "}
        to see messages.
      </p>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Academic Inbox</h2>
          <p className="text-xs text-muted-foreground">All communications and alerts</p>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-transparent px-4 py-8 text-center flex flex-col items-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((u) => (
            <li key={u._id} className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${kindStyles[u.type] ?? kindStyles.system}`}
                >
                  {kindIcons[u.type] ?? kindIcons.system}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {u.type.replace(/_/g, " ")} {u.studentId ? `• ${u.studentId.name}` : ""}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{u.message}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
