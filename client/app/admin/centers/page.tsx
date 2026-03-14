"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import {
  useAdminCenters,
  useBlockCenter,
  useRejectCenter,
  useUnblockCenter,
  useUpdatePaymentStatus,
  useVerifyCenter,
} from "@/hooks/useAdmin";
import { AdminCenter } from "@/types/admin/adminTypes";

export default function AdminCentersPage() {
  const { data: centersRes } = useAdminCenters();
  const centers = (centersRes?.data ?? []) as AdminCenter[];
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [confirmTone, setConfirmTone] = useState<"default" | "warning" | "danger">("default");
  const [confirmReasonRequired, setConfirmReasonRequired] = useState(false);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | ((reason: string) => Promise<void>)>(null);

  const blockCenter = useBlockCenter();
  const unblockCenter = useUnblockCenter();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const verifyCenter = useVerifyCenter();
  const rejectCenter = useRejectCenter();

  const openConfirm = (config: {
    title: string;
    message: string;
    label?: string;
    tone?: "default" | "warning" | "danger";
    requireReason?: boolean;
    onConfirm: (reason: string) => Promise<void>;
  }) => {
    setConfirmTitle(config.title);
    setConfirmMessage(config.message);
    setConfirmLabel(config.label ?? "Confirm");
    setConfirmTone(config.tone ?? "default");
    setConfirmReasonRequired(Boolean(config.requireReason));
    setConfirmReason("");
    setConfirmError("");
    setConfirmAction(() => config.onConfirm);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmReasonRequired && !confirmReason.trim()) {
      setConfirmError("Reason is required.");
      return;
    }
    setConfirmLoading(true);
    try {
    await confirmAction(confirmReason.trim());
      setConfirmOpen(false);
    } catch (error) {
      setConfirmError((error as Error)?.message ?? "Action failed.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: centers.length,
      active: centers.filter((center) => center.subscriptionStatus === "active").length,
      pending: centers.filter((center) => center.subscriptionStatus === "pending_payment").length,
      blocked: centers.filter((center) => center.subscriptionStatus === "blocked").length,
    };
  }, [centers]);

  const filteredCenters = useMemo(() => {
    if (!query.trim()) return centers;
    const needle = query.toLowerCase();
    return centers.filter(
      (center) =>
        center.name.toLowerCase().includes(needle) ||
        center.email.toLowerCase().includes(needle) ||
        (center.owner?.name?.toLowerCase().includes(needle) ?? false)
    );
  }, [centers, query]);

  const handleBlock = async (centerId: string) => {
    openConfirm({
      title: "Block Center",
      message: "This will disable access for the entire center.",
      label: "Block",
      tone: "danger",
      requireReason: true,
      onConfirm: async (reason: string) => {
        await blockCenter.mutateAsync({ id: centerId, payload: { blockedReason: reason } });
      },
    });
  };

  const handleStatus = async (centerId: string, status: "active" | "pending_payment" | "expired") => {
    openConfirm({
      title: "Update Subscription",
      message: `Change subscription status to "${status}"?`,
      label: "Update",
      tone: "warning",
      onConfirm: async () => {
        const payload =
          status === "active"
            ? { subscriptionStatus: status, lastPaymentDate: new Date().toISOString().split("T")[0] }
            : { subscriptionStatus: status };
        await updatePaymentStatus.mutateAsync({ id: centerId, payload });
      },
    });
  };

  const handleApprove = async (centerId: string) => {
    openConfirm({
      title: "Approve Center",
      message: "This will approve the center and enable onboarding.",
      label: "Approve",
      onConfirm: async () => {
        await verifyCenter.mutateAsync(centerId);
      },
    });
  };

  const handleReject = async (centerId: string) => {
    openConfirm({
      title: "Reject Center",
      message: "This will mark the center as rejected.",
      label: "Reject",
      tone: "warning",
      onConfirm: async () => {
        await rejectCenter.mutateAsync(centerId);
      },
    });
  };

  const handleUnblock = async (centerId: string) => {
    openConfirm({
      title: "Unblock Center",
      message: "This will restore access for the center.",
      label: "Unblock",
      onConfirm: async () => {
        await unblockCenter.mutateAsync(centerId);
      },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Manage verification, subscription, and access status.</p>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Centers", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Pending Payment", value: stats.pending },
          { label: "Blocked", value: stats.blocked },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">All Centers</p>
              <p className="text-xs text-muted-foreground">Search by center name, owner, or email.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search centers..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
              />
            </div>
          </div>
        </div>
        <div className="hidden grid-cols-7 gap-2 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
          <span>Center</span>
          <span>Owner</span>
          <span>Plan</span>
          <span>Subscription</span>
          <span>Status</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-border">
          {filteredCenters.map((center) => (
            <div key={center.id} className="px-4 py-4">
              <div className="space-y-3 md:hidden">
                <div>
                  <p className="text-base font-semibold">{center.name}</p>
                  <p className="text-xs text-muted-foreground">{center.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Owner: {center.owner?.name ?? "Unknown"}</span>
                  {center.owner && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        center.owner.isVerified
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {center.owner.isVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {center.subscriptionStatus}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">{center.status ?? "pending"}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/admin/centers/${center.id}`}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleApprove(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBlock(center.id)}
                    className="cursor-pointer rounded-md border border-destructive/30 px-2 py-1 text-destructive transition hover:bg-destructive/10"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => handleUnblock(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Unblock
                  </button>
                </div>
              </div>

              <div className="hidden grid-cols-7 gap-2 text-sm md:grid">
                <div>
                  <p className="font-medium">{center.name}</p>
                  <p className="text-xs text-muted-foreground">{center.email}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{center.owner?.name ?? "Unknown"}</span>
                    {center.owner && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          center.owner.isVerified
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {center.owner.isVerified ? "Verified" : "Unverified"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {center.planType ? center.planType.toUpperCase() : center.planName ?? "Standard Plan"}
                </div>
                <div className="text-xs">
                  <span className="rounded-full border border-border px-2 py-1">{center.subscriptionStatus}</span>
                </div>
                <div className="text-xs">{center.status ?? "pending"}</div>
                <div className="text-xs text-muted-foreground">
                  {center.createdAt ? new Date(center.createdAt).toLocaleDateString() : "-"}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/admin/centers/${center.id}`}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleApprove(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBlock(center.id)}
                    className="cursor-pointer rounded-md border border-destructive/30 px-2 py-1 text-destructive transition hover:bg-destructive/10"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => handleUnblock(center.id)}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Unblock
                  </button>
                  <button
                    onClick={() => handleStatus(center.id, "active")}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleStatus(center.id, "pending_payment")}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleStatus(center.id, "expired")}
                    className="cursor-pointer rounded-md border border-border px-2 py-1 transition hover:bg-secondary"
                  >
                    Expired
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredCenters.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">No centers found.</div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmLabel}
        tone={confirmTone}
        isLoading={confirmLoading}
        requireReason={confirmReasonRequired}
        reasonLabel="Block Reason"
        reasonValue={confirmReason}
        reasonError={confirmError}
        onReasonChange={setConfirmReason}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}
