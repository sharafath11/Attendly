"use client";

import { useAdminLogs } from "@/hooks/useAdmin";
import type { AdminLogs } from "@/types/admin/adminTypes";

export default function AdminLogsPage() {
  const { data: res, isLoading } = useAdminLogs();
  const logs = (res?.data ?? { activities: [], whatsappFailures: [] }) as AdminLogs;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Activity (latest)</h2>
        <p className="text-xs text-muted-foreground">Staff actions across centers</p>
        <ul className="mt-3 max-h-[480px] space-y-2 overflow-y-auto text-sm">
          {isLoading ? (
            <li className="text-muted-foreground">Loading…</li>
          ) : logs.activities.length === 0 ? (
            <li className="text-muted-foreground">No activity yet.</li>
          ) : (
            logs.activities.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/80 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground">
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                  <span className="font-mono">{a.centerId}</span>
                </div>
                <div className="mt-1 font-medium text-foreground">{a.action}</div>
                <div className="text-xs text-muted-foreground">{a.summary}</div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">WhatsApp failures</h2>
        <p className="text-xs text-muted-foreground">Recent delivery issues</p>
        <ul className="mt-3 max-h-[480px] space-y-2 overflow-y-auto text-sm">
          {isLoading ? (
            <li className="text-muted-foreground">Loading…</li>
          ) : logs.whatsappFailures.length === 0 ? (
            <li className="text-muted-foreground">No failed WhatsApp rows.</li>
          ) : (
            logs.whatsappFailures.map((w) => (
              <li key={w.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground">
                  <span>{new Date(w.createdAt).toLocaleString()}</span>
                  <span>{w.type}</span>
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{w.centerId}</div>
                {w.error ? <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{w.error}</div> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
