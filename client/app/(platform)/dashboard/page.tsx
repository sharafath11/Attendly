"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  IndianRupee,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useBatches } from "@/hooks/useBatches";
import { useLowAttendanceStudents } from "@/hooks/useAttendance";
import type { DashboardData } from "@/types/dashboard/dashboardTypes";
import EmptyState from "@/components/product/EmptyState";
import { useAuth } from "@/context/AuthContext";
import TeacherDashboardStats from "@/components/dashboard/TeacherDashboardStats";

const emptyDashboard: DashboardData = {
  summary: {
    totalStudents: 0,
    todayAttendance: 0,
    pendingFees: 0,
    pendingFeesAmount: 0,
    totalBatches: 0,
  },
  insights: {
    remindersSent30d: 0,
    feesCollectedMonthInr: 0,
    attendanceRateLast30d: 0,
    unpaidStudentsCount: 0,
    attendanceNotFullyMarkedToday: false,
    insightLines: [],
  },
  attendanceChart: [],
  attendanceMonthlyChart: [],
  feeChart: [],
  recentAttendance: [],
  recentPayments: [],
  upcomingClasses: [],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatToday = () =>
  new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

export default function DashboardPage() {
  const { isOwner } = useAuth();
  const { data: dashboardRes, isLoading } = useDashboard();
  const dashboard = dashboardRes?.data ?? emptyDashboard;
  const { data: batchesRes } = useBatches();
  const firstBatchId = batchesRes?.data?.batches?.[0]?.id;
  const { data: lowAttendanceRes } = useLowAttendanceStudents(firstBatchId);
  const lowAttendance = (lowAttendanceRes?.data ?? []).slice(0, 4);

  const attendanceRate = dashboard.summary.totalStudents
    ? Math.round((dashboard.summary.todayAttendance / dashboard.summary.totalStudents) * 100)
    : 0;

  const monthlyRevenue = useMemo(() => {
    if (dashboard.insights?.feesCollectedMonthInr != null) {
      return dashboard.insights.feesCollectedMonthInr;
    }
    const fc = dashboard.feeChart;
    if (!fc.length) return 0;
    return fc[fc.length - 1].amount;
  }, [dashboard.feeChart, dashboard.insights?.feesCollectedMonthInr]);

  const hasStudents = dashboard.summary.totalStudents > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{formatToday()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Your center at a glance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here’s what to do next — tap a card or a quick action below.
          </p>
        </div>
        {isOwner && (
          <Link
            href="/company-analytics"
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <TrendingUp className="h-4 w-4" />
            Company Analytics
          </Link>
        )}
      </div>

      {dashboard.insights?.insightLines && dashboard.insights.insightLines.length > 0 ? (
        <section aria-label="Smart alerts" className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Smart alerts</h2>
          </div>
          <ul className="space-y-2 text-sm text-foreground">
            {dashboard.insights.insightLines.map((line, idx) => (
              <li key={`${idx}-${line}`} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isOwner && !hasStudents ? (
        <EmptyState
          icon={Users}
          title="Add your first students"
          description="Once students are in, you’ll see attendance, fees, and reminders here without digging through menus."
          actionLabel="Open setup guide"
          onAction={() => {
            window.location.href = "/onboarding";
          }}
        />
      ) : null}

      <section aria-label="Today">
        <h2 className="sr-only">Key numbers</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            href="/attendance"
            label="Today's attendance"
            value={String(dashboard.summary.todayAttendance)}
            sub={
              dashboard.insights?.attendanceNotFullyMarkedToday
                ? "Not marked yet for all classes"
                : dashboard.summary.totalStudents
                  ? `${attendanceRate}% of roster`
                  : "No one enrolled yet"
            }
            icon={<CalendarCheck2 className="h-5 w-5" />}
            accent="bg-primary/10 text-primary"
          />
          {isOwner && (
            <>
              <MetricCard
                href="/fees"
                label="Pending fees"
                value={String(dashboard.summary.pendingFees)}
                sub={
                  dashboard.summary.pendingFeesAmount
                    ? `${formatCurrency(dashboard.summary.pendingFeesAmount)} not collected yet`
                    : "All caught up"
                }
                icon={<WalletCards className="h-5 w-5" />}
                accent="bg-amber-500/10 text-amber-700 dark:text-amber-300"
              />
              <MetricCard
                href="/fees"
                label="This month's collection"
                value={monthlyRevenue ? formatCurrency(monthlyRevenue) : "—"}
                sub={
                  monthlyRevenue
                    ? `${formatCurrency(monthlyRevenue)} collected`
                    : "Record fees to see totals"
                }
                icon={<TrendingUp className="h-5 w-5" />}
                accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              />
            </>
          )}
        </div>
      </section>

      <section aria-label="Quick actions">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/attendance"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:bg-muted/50"
          >
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            Mark attendance
          </Link>
          <Link
            href="/messages"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:bg-muted/50"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            Send reminder
          </Link>
          {isOwner && (
            <>
              <Link
                href="/students"
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:bg-muted/50"
              >
                <Users className="h-4 w-4 text-primary" />
                Add student
              </Link>
              <Link
                href="/fees"
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:bg-muted/50"
              >
                <IndianRupee className="h-4 w-4 text-primary" />
                Collect payment
              </Link>
            </>
          )}
        </div>
      </section>

      <section aria-label="Insights">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">More insights</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-foreground">30-day pulse</p>
            <p className="text-xs text-muted-foreground">Automation & consistency</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Attendance rate</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {dashboard.insights?.attendanceRateLast30d ?? 0}%
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Fee reminders sent</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {dashboard.insights?.remindersSent30d ?? 0}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Low attendance</p>
                <p className="text-xs text-muted-foreground">Needs a quick call {firstBatchId ? "" : "(add a batch first)"}</p>
              </div>
              <Link href="/attendance" className="text-xs font-medium text-primary hover:underline">
                View
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {lowAttendance.length === 0 ? (
                <li className="text-sm text-muted-foreground">No one is below 75% right now. Nice work.</li>
              ) : (
                lowAttendance.map((s) => (
                  <li
                    key={s.studentId}
                    className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">{s.studentName}</span>
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {s.attendancePercentage}%
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {isOwner && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Recent payments</p>
                  <p className="text-xs text-muted-foreground">Last few collections</p>
                </div>
                <Link href="/fees" className="text-xs font-medium text-primary hover:underline">
                  All fees
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {dashboard.recentPayments.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No payments recorded yet.</li>
                ) : (
                  dashboard.recentPayments.slice(0, 4).map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium text-foreground">{p.student}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{formatCurrency(p.amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </section>

      {!isOwner && (
        <TeacherDashboardStats />
      )}

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Want the full analytics view?</span>
          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
          >
            Open reports
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  href,
  label,
  value,
  sub,
  icon,
  accent,
}: {
  href: string;
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
    >
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
