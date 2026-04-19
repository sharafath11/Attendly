"use client";

import { useState } from "react";
import { useAdminUsers } from "@/hooks/useAdmin";
import type { AdminUserRow } from "@/types/admin/adminTypes";

const ROLES = ["all", "center_owner", "teacher", "parent", "super_admin"] as const;

export default function AdminUsersPage() {
  const [role, setRole] = useState<(typeof ROLES)[number]>("all");
  const { data: res, isLoading } = useAdminUsers(role === "all" ? undefined : role);
  const rows = (res?.data ?? []) as AdminUserRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">
          Filter role
          <select
            className="ml-2 rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground"
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted-foreground">Showing up to 500 users (newest first)</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Center</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-border/80 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                    {u.phone ? <div className="text-xs text-muted-foreground">{u.phone}</div> : null}
                  </td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">
                    {u.centerId ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
