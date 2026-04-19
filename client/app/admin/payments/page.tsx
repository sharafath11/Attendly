"use client";

import { useAdminRevenue } from "@/hooks/useAdmin";
import type { AdminRevenue } from "@/types/admin/adminTypes";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminPaymentsPage() {
  const { data: res, isLoading } = useAdminRevenue();
  const r = (res?.data ?? {}) as AdminRevenue;

  const cards = [
    { label: "MRR (from center plans)", value: fmt(r.monthlyRecurringRevenue ?? 0) },
    { label: "Razorpay collected (platform)", value: fmt(r.platformPaymentsCollectedInr ?? 0) },
    { label: "Active subscriptions", value: String(r.activeSubscriptionCenters ?? 0) },
    { label: "Pending payment", value: String(r.pendingPaymentCenters ?? 0) },
    { label: "Expired", value: String(r.expiredCenters ?? 0) },
    { label: "Blocked", value: String(r.blockedCentersCount ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Subscription MRR is summed from active centers with a monthly fee. Platform total is parent/student Razorpay
        payments recorded in Attendly.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-xl font-semibold">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
