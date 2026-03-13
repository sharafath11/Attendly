"use client";

import { useMemo, useState } from "react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Modal from "@/components/dashboard/Modal";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { WalletCards, AlertTriangle } from "lucide-react";
import { useBatches } from "@/hooks/useBatches";
import { useFees, useMarkFeePaid, useUpdateFeeStatus } from "@/hooks/useFees";
import type { FeeRecord, FeeStatus, PaymentMethod } from "@/types/fees/feesTypes";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const paymentMethods: PaymentMethod[] = ["Cash", "UPI", "Bank"];
const statusOptions: Array<FeeStatus | "All"> = ["All", "Paid", "Pending", "Overdue"];

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export default function FeesPage() {
  const { month: initialMonth, year: initialYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [batchId, setBatchId] = useState<string>("All");
  const [status, setStatus] = useState<FeeStatus | "All">("All");

  const { data: batchesData } = useBatches();
  const batches = batchesData?.data?.batches ?? [];

  const filters = useMemo(
    () => ({
      month,
      year,
      batchId: batchId === "All" ? undefined : batchId,
      status,
    }),
    [month, year, batchId, status]
  );

  const { data: feesData, isLoading } = useFees(filters);
  const fees = feesData?.data ?? [];

  const totalCollected = fees
    .filter((fee) => fee.status === "Paid")
    .reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const totalPending = fees
    .filter((fee) => fee.status === "Pending" || fee.status === "Overdue")
    .reduce((sum, fee) => sum + (fee.amount || 0), 0);

  const markPaid = useMarkFeePaid();
  const updateStatus = useUpdateFeeStatus();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("Cash");
  const [editStatus, setEditStatus] = useState<FeeStatus>("Pending");
  const [changeNote, setChangeNote] = useState("");

  const openMarkPaid = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setSelectedPaymentMethod("Cash");
    setConfirmOpen(true);
  };

  const openEditStatus = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setEditStatus(fee.status);
    setChangeNote(fee.changeNote || "");
    setEditOpen(true);
  };

  const openView = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setViewOpen(true);
  };

  const handleConfirmPaid = async () => {
    if (!selectedFee) return;
    const res = await markPaid.mutateAsync({
      studentId: selectedFee.studentId,
      batchId: selectedFee.batchId,
      month: selectedFee.month,
      year: selectedFee.year,
      paymentMethod: selectedPaymentMethod,
    });
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to mark paid");
      return;
    }
    showSuccessToast(res.msg || "Marked as paid");
    setConfirmOpen(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedFee) return;
    const res = await updateStatus.mutateAsync({
      studentId: selectedFee.studentId,
      batchId: selectedFee.batchId,
      month: selectedFee.month,
      year: selectedFee.year,
      status: editStatus,
      changeNote: changeNote.trim() || undefined,
    });
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to update status");
      return;
    }
    showSuccessToast(res.msg || "Payment status updated");
    setEditOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fees</h1>
        <p className="text-sm text-muted-foreground">Track monthly tuition payments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          title="Total Collected"
          value={totalCollected}
          prefix="₹"
          icon={<WalletCards className="h-5 w-5" />}
          trend={`${monthNames[month - 1]} ${year}`}
        />
        <DashboardCard
          title="Pending Fees"
          value={totalPending}
          prefix="₹"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="Pending or overdue"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {monthNames.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {[initialYear - 1, initialYear, initialYear + 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={batchId}
          onChange={(event) => setBatchId(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batchName}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeeStatus | "All")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All Status" : option}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading fees...
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "student", header: "Student", render: (row) => row.student.name },
            {
              key: "month",
              header: "Month",
              render: (row) => `${monthNames[row.month - 1]} ${row.year}`,
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) => `₹${row.amount.toLocaleString()}`,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openView(row)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    View
                  </button>
                  <button
                    onClick={() =>
                      row.status === "Paid" ? openEditStatus(row) : openMarkPaid(row)
                    }
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    {row.status === "Paid" ? "Edit Payment" : "Mark Paid"}
                  </button>
                </div>
              ),
            },
          ]}
          data={fees}
        />
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Payment">
        <p className="text-sm text-muted-foreground">
          Are you sure this student has paid the tuition fee?
        </p>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment Method
          </label>
          <select
            value={selectedPaymentMethod}
            onChange={(event) => setSelectedPaymentMethod(event.target.value as PaymentMethod)}
            className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPaid} isLoading={markPaid.isPending}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Payment Status">
        <p className="text-sm text-muted-foreground">
          Do you want to change the payment status for this student?
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </label>
            <select
              value={editStatus}
              onChange={(event) => setEditStatus(event.target.value as FeeStatus)}
              className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {["Paid", "Pending", "Overdue"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Change Note (optional)
            </label>
            <textarea
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} isLoading={updateStatus.isPending}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Payment Details">
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide">Student</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee?.student.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Month</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee ? `${monthNames[selectedFee.month - 1]} ${selectedFee.year}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Amount</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee ? `₹${selectedFee.amount.toLocaleString()}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Status</p>
              {selectedFee ? <StatusBadge status={selectedFee.status} /> : "—"}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Payment Method</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee?.paymentMethod ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Paid Date</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee?.paidDate
                  ? new Date(selectedFee.paidDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Marked By</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee?.markedBy ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Last Edited By</p>
              <p className="text-sm font-medium text-foreground">
                {selectedFee?.editedBy ?? "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment History</p>
            <div className="mt-2 space-y-2">
              {selectedFee?.editHistory?.length ? (
                selectedFee.editHistory.map((entry, index) => (
                  <div key={`${entry.editedAt}-${index}`} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(entry.editedAt).toLocaleDateString()} — {entry.previousStatus} →{" "}
                      {entry.newStatus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Edited By: {entry.editedBy}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">Note: {entry.note}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No edits recorded.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setViewOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
