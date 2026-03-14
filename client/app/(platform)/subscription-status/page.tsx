"use client";

import { useSubscription } from "@/components/dashboard/SubscriptionContext";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export default function SubscriptionStatusPage() {
  const {
    subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    planType,
    loading,
  } = useSubscription();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading subscription details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Subscription Status</h1>
        <p className="text-sm text-muted-foreground">Track your plan and payment verification.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan Type</p>
          <p className="mt-2 text-base font-semibold text-foreground">{planType ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscription Status</p>
          <p className="mt-2 text-base font-semibold text-foreground">{subscriptionStatus ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Start Date</p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {formatDate(subscriptionStartDate)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">End Date</p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {formatDate(subscriptionEndDate)}
          </p>
        </div>
      </div>

      {subscriptionStatus === "pending_payment" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Waiting for admin payment verification.
        </div>
      )}
    </div>
  );
}
