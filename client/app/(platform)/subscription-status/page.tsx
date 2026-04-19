"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function SubscriptionStatusPage() {
  const {
    subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    planType,
    loading,
  } = useSubscription();

  const daysLeft = (() => {
    if (!subscriptionEndDate) return null;
    const end = new Date(subscriptionEndDate);
    if (Number.isNaN(end.getTime())) return null;
    const diff = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Loading your plan…
      </div>
    );
  }

  const isActive = subscriptionStatus === "active";

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Your plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See what you’re paying for and how long it stays active.
        </p>
      </div>

      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          isActive ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30" : "border-border bg-card"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{planType ?? "Standard"}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              {isActive ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Active
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {subscriptionStatus ?? "Status unknown"}
                </>
              )}
            </p>
          </div>
          {daysLeft !== null ? (
            <div className="rounded-xl bg-background/80 px-4 py-3 text-center shadow-inner dark:bg-background/20">
              <p className="text-2xl font-bold tabular-nums text-foreground">{daysLeft}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Days left</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 text-sm sm:grid-cols-2">
          <div className="flex gap-2 rounded-xl bg-background/50 px-3 py-2 dark:bg-background/10">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="font-medium text-foreground">{formatDate(subscriptionStartDate)}</p>
            </div>
          </div>
          <div className="flex gap-2 rounded-xl bg-background/50 px-3 py-2 dark:bg-background/10">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Renews / ends</p>
              <p className="font-medium text-foreground">{formatDate(subscriptionEndDate)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-semibold">If your plan expires, you lose:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90 dark:text-amber-100/90">
          <li>Automated fee reminders to parents</li>
          <li>Unlimited attendance history exports</li>
          <li>Multi-teacher access for your staff</li>
        </ul>
        <p className="mt-3 text-xs opacity-90">Your data stays safe — you can renew anytime to unlock everything again.</p>
      </div>

      {subscriptionStatus === "pending_payment" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          We’re waiting for payment confirmation from the admin. Features stay paused until then.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
          Upgrade when you’re ready — we’ll move you without losing data.
        </p>
        <Link
          href="/settings"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          Contact to upgrade
        </Link>
      </div>
    </div>
  );
}
