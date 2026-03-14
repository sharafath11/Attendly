"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import {
  useAdminCenter,
  useBlockCenter,
  useRejectCenter,
  useUnblockCenter,
  useUpdatePaymentStatus,
  useVerifyCenter,
  useVerifyUser,
  useUnverifyUser,
} from "@/hooks/useAdmin";
import { AdminCenterDetail } from "@/types/admin/adminTypes";

export default function AdminCenterDetailPage() {
  const params = useParams();
  const centerId = params?.id as string;
  const { data } = useAdminCenter(centerId);
  const center = (data?.data ?? null) as AdminCenterDetail | null;

  const blockCenter = useBlockCenter();
  const unblockCenter = useUnblockCenter();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const verifyCenter = useVerifyCenter();
  const rejectCenter = useRejectCenter();
  const verifyUser = useVerifyUser();
  const unverifyUser = useUnverifyUser();
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

  if (!center) {
    return <div className="text-sm text-muted-foreground">Loading center...</div>;
  }

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

  const handleBlock = async () => {
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

  const handleStatus = async (status: "active" | "pending_payment" | "expired") => {
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

  const handleApprove = async () => {
    openConfirm({
      title: "Approve Center",
      message: "This will approve the center and enable onboarding.",
      label: "Approve",
      onConfirm: async () => {
        await verifyCenter.mutateAsync(centerId);
      },
    });
  };

  const handleReject = async () => {
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

  const handleUnblock = async () => {
    openConfirm({
      title: "Unblock Center",
      message: "This will restore access for the center.",
      label: "Unblock",
      onConfirm: async () => {
        await unblockCenter.mutateAsync(centerId);
      },
    });
  };

  const handleOwnerVerification = async (next: boolean) => {
    if (!center.owner?.id) return;
    openConfirm({
      title: next ? "Verify Owner" : "Unverify Owner",
      message: next
        ? "This will allow login if verification was required."
        : "This may block login for the owner account.",
      label: next ? "Verify" : "Unverify",
      tone: next ? "default" : "warning",
      onConfirm: async () => {
        if (next) {
          await verifyUser.mutateAsync(center.owner!.id);
        } else {
          await unverifyUser.mutateAsync(center.owner!.id);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{center.name}</h1>
            <p className="text-sm text-muted-foreground">{center.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border px-3 py-1">
              Subscription: {center.subscriptionStatus}
            </span>
            <span className="rounded-full border border-border px-3 py-1">Center: {center.status ?? "pending"}</span>
            <span
              className={`rounded-full border px-3 py-1 ${
                center.blocked
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {center.blocked ? "Blocked" : "Operational"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Students", value: center.totalStudents },
          { label: "Total Teachers", value: center.totalTeachers },
          { label: "Monthly Fee", value: center.monthlyFee ?? 0 },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold">Center Details</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Owner: {center.owner?.name ?? "Unknown"}</p>
            <p>Owner Email: {center.owner?.email ?? "-"}</p>
            <p>Plan: {center.planName ?? "Standard Plan"}</p>
            <p>Plan Type: {center.planType ?? "-"}</p>
            <p>Teacher Limit: {center.teacherLimit ?? "-"}</p>
            <p>Student Limit: {center.studentLimit ?? "-"}</p>
            <p>Last Payment: {center.lastPaymentDate ?? "-"}</p>
            <p>Created: {center.createdAt ? new Date(center.createdAt).toLocaleDateString() : "-"}</p>
          </div>
          {center.owner && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  center.owner.isVerified
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                }`}
              >
                {center.owner.isVerified ? "Owner Verified" : "Owner Unverified"}
              </span>
              <button
                onClick={() => handleOwnerVerification(true)}
                className="cursor-pointer rounded-md border border-emerald-500/30 px-3 py-2 text-emerald-600 transition hover:bg-emerald-500/10"
              >
                Verify Owner
              </button>
              <button
                onClick={() => handleOwnerVerification(false)}
                className="cursor-pointer rounded-md border border-amber-500/30 px-3 py-2 text-amber-600 transition hover:bg-amber-500/10"
              >
                Unverify Owner
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Actions</h2>
          <div className="mt-4 space-y-4 text-xs">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Center Approval</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleApprove}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Reject
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Subscription</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatus("active")}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Mark Paid
                </button>
                <button
                  onClick={() => handleStatus("pending_payment")}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatus("expired")}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Expired
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Risk Controls</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBlock}
                  className="cursor-pointer rounded-md border border-destructive/30 px-3 py-2 text-destructive transition hover:bg-destructive/10"
                >
                  Block Center
                </button>
                <button
                  onClick={handleUnblock}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 transition hover:bg-secondary"
                >
                  Unblock Center
                </button>
              </div>
            </div>
          </div>
          {center.blockedReason && (
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              Blocked reason: {center.blockedReason}
            </div>
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
