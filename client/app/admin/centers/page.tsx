"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/admin/ConfirmModal";
import {
  useAdminCenters,
  useBlockCenter,
  useRejectCenter,
  useUnblockCenter,
  useUpdatePaymentStatus,
  useVerifyCenter,
  useUpdateUserStatus,
  useVerifyUser,
  useUnverifyUser,
} from "@/hooks/useAdmin";
import { AdminCenter } from "@/types/admin/adminTypes";

export default function AdminCentersPage() {
  const { data: centersRes } = useAdminCenters();
  const centers = (centersRes?.data ?? []) as AdminCenter[];
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
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
  const updateUserStatus = useUpdateUserStatus();
  const verifyUser = useVerifyUser();
  const unverifyUser = useUnverifyUser();

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

  const owners = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; status: string; isVerified: boolean; centers: number }>();
    centers.forEach((center) => {
      if (!center.owner) return;
      const existing = map.get(center.owner.id);
      if (existing) {
        existing.centers += 1;
        return;
      }
      map.set(center.owner.id, {
        id: center.owner.id,
        name: center.owner.name,
        email: center.owner.email,
        status: center.owner.status ?? "pending",
        isVerified: center.owner.isVerified,
        centers: 1,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [centers]);

  const filteredCenters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return centers.filter((center) => {
      const matchesOwner =
        ownerFilter === "all" ? true : center.owner?.id === ownerFilter;
      const matchesQuery = !needle
        ? true
        : center.name.toLowerCase().includes(needle) ||
          center.email.toLowerCase().includes(needle) ||
          (center.owner?.name?.toLowerCase().includes(needle) ?? false);
      return matchesOwner && matchesQuery;
    });
  }, [centers, query, ownerFilter]);

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

  const handleOwnerStatus = async (ownerId: string, status: "active" | "pending" | "disabled") => {
    openConfirm({
      title: "Update Owner Status",
      message: `Set owner status to "${status}"?`,
      label: "Update",
      tone: status === "disabled" ? "danger" : "warning",
      onConfirm: async () => {
        await updateUserStatus.mutateAsync({ id: ownerId, payload: { status } });
      },
    });
  };

  const handleOwnerVerify = async (ownerId: string, nextVerified: boolean) => {
    openConfirm({
      title: nextVerified ? "Verify Owner" : "Unverify Owner",
      message: nextVerified
        ? "This will mark the owner as verified."
        : "This will mark the owner as unverified.",
      label: nextVerified ? "Verify" : "Unverify",
      tone: nextVerified ? "default" : "warning",
      onConfirm: async () => {
        if (nextVerified) {
          await verifyUser.mutateAsync(ownerId);
        } else {
          await unverifyUser.mutateAsync(ownerId);
        }
      },
    });
  };

  const handleCenterAction = (center: AdminCenter, action: string) => {
    if (!action) return;
    if (action === "view") {
      router.push(`/admin/centers/${center.id}`);
      return;
    }
    if (action === "approve") return void handleApprove(center.id);
    if (action === "reject") return void handleReject(center.id);
    if (action === "block") return void handleBlock(center.id);
    if (action === "unblock") return void handleUnblock(center.id);
    if (action === "activate") return void handleStatus(center.id, "active");
    if (action === "pending") return void handleStatus(center.id, "pending_payment");
    if (action === "expired") return void handleStatus(center.id, "expired");
    if (action === "owner-activate" && center.owner?.id) return void handleOwnerStatus(center.owner.id, "active");
    if (action === "owner-disable" && center.owner?.id) return void handleOwnerStatus(center.owner.id, "disabled");
    if (action === "owner-verify" && center.owner?.id) return void handleOwnerVerify(center.owner.id, true);
    if (action === "owner-unverify" && center.owner?.id) return void handleOwnerVerify(center.owner.id, false);
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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <select
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30 sm:w-56"
              >
                <option value="all">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search centers..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30 sm:w-64"
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
                <div className="text-xs">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      handleCenterAction(center, event.target.value);
                      event.currentTarget.value = "";
                    }}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="" disabled>
                      Actions
                    </option>
                    <option value="view">View</option>
                    <option value="approve">Approve Center</option>
                    <option value="reject">Reject Center</option>
                    <option value="block">Block Center</option>
                    <option value="unblock">Unblock Center</option>
                    <option value="activate">Subscription Active</option>
                    <option value="pending">Subscription Pending</option>
                    <option value="expired">Subscription Expired</option>
                    <option value="owner-verify">Verify Owner</option>
                    <option value="owner-unverify">Unverify Owner</option>
                    <option value="owner-activate">Owner Active</option>
                    <option value="owner-disable">Owner Disabled</option>
                  </select>
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
                <div className="text-xs">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      handleCenterAction(center, event.target.value);
                      event.currentTarget.value = "";
                    }}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="" disabled>
                      Actions
                    </option>
                    <option value="view">View</option>
                    <option value="approve">Approve Center</option>
                    <option value="reject">Reject Center</option>
                    <option value="block">Block Center</option>
                    <option value="unblock">Unblock Center</option>
                    <option value="activate">Subscription Active</option>
                    <option value="pending">Subscription Pending</option>
                    <option value="expired">Subscription Expired</option>
                    <option value="owner-verify">Verify Owner</option>
                    <option value="owner-unverify">Unverify Owner</option>
                    <option value="owner-activate">Owner Active</option>
                    <option value="owner-disable">Owner Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {filteredCenters.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">No centers found.</div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Owners</p>
            <p className="text-xs text-muted-foreground">Owner list with status and center count.</p>
          </div>
        </div>
        <div className="hidden grid-cols-5 gap-2 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid">
          <span>Owner</span>
          <span>Email</span>
          <span>Centers</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-border">
          {owners.map((owner) => (
            <div key={owner.id} className="px-4 py-4">
              <div className="space-y-2 md:hidden">
                <div>
                  <p className="text-base font-semibold">{owner.name}</p>
                  <p className="text-xs text-muted-foreground">{owner.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5">{owner.status}</span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {owner.isVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5">
                    Centers: {owner.centers}
                  </span>
                </div>
                <select
                  defaultValue=""
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "verify") handleOwnerVerify(owner.id, true);
                    if (value === "unverify") handleOwnerVerify(owner.id, false);
                    if (value === "active") handleOwnerStatus(owner.id, "active");
                    if (value === "disabled") handleOwnerStatus(owner.id, "disabled");
                    event.currentTarget.value = "";
                  }}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="" disabled>
                    Actions
                  </option>
                  <option value="verify">Verify Owner</option>
                  <option value="unverify">Unverify Owner</option>
                  <option value="active">Set Active</option>
                  <option value="disabled">Set Disabled</option>
                </select>
              </div>

              <div className="hidden grid-cols-5 gap-2 text-sm md:grid">
                <div className="font-medium">{owner.name}</div>
                <div className="text-xs text-muted-foreground">{owner.email}</div>
                <div className="text-xs">{owner.centers}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-1">{owner.status}</span>
                  <span className="rounded-full border border-border px-2 py-1">
                    {owner.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="text-xs">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "verify") handleOwnerVerify(owner.id, true);
                      if (value === "unverify") handleOwnerVerify(owner.id, false);
                      if (value === "active") handleOwnerStatus(owner.id, "active");
                      if (value === "disabled") handleOwnerStatus(owner.id, "disabled");
                      event.currentTarget.value = "";
                    }}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="" disabled>
                      Actions
                    </option>
                    <option value="verify">Verify Owner</option>
                    <option value="unverify">Unverify Owner</option>
                    <option value="active">Set Active</option>
                    <option value="disabled">Set Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {owners.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">No owners found.</div>
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
