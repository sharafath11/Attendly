"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Modal from "@/components/dashboard/Modal";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useBatch } from "@/hooks/useBatches";
import { useStudents } from "@/hooks/useStudents";
import { useFees, useMarkFeePaid, useUpdateFeeStatus } from "@/hooks/useFees";
import type { FeeRecord, FeeStatus, PaymentMethod } from "@/types/fees/feesTypes";

const paymentMethods: PaymentMethod[] = ["Cash", "UPI", "Bank"];

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export default function BatchStudentsPage() {
  const params = useParams();
  const batchId = typeof params?.batchId === "string" ? params.batchId : "";
  const { month, year } = getCurrentMonthYear();

  const { data: batchData } = useBatch(batchId);
  const batch = batchData?.data;

  const studentsQuery = useMemo(
    () => ({
      batchId: batchId || undefined,
      page: 1,
      limit: 100,
    }),
    [batchId]
  );

  const { data: studentsData, isLoading } = useStudents(studentsQuery);
  const students = studentsData?.data?.students ?? [];

  const { data: feesData } = useFees({
    month,
    year,
    batchId: batchId || undefined,
    status: "All",
  });
  const fees = feesData?.data ?? [];
  const feeByStudentId = useMemo(() => {
    const map = new Map<string, FeeRecord>();
    fees.forEach((fee) => map.set(fee.studentId, fee));
    return map;
  }, [fees]);

  const markPaid = useMarkFeePaid();
  const updateStatus = useUpdateFeeStatus();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
        <h1 className="text-2xl font-semibold text-foreground">Batch Students</h1>
        <p className="text-sm text-muted-foreground">
          {batch?.batchName ? `Students in ${batch.batchName}.` : "Student list for this batch."}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading students...
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Student Name" },
            { key: "phone", header: "Phone" },
            { key: "parentPhone", header: "Parent Phone" },
            {
              key: "monthlyFee",
              header: "Monthly Fee",
              render: (row) => `₹${row.monthlyFee.toLocaleString()}`,
            },
            {
              key: "feeStatus",
              header: "Fee Status",
              render: (row) => {
                const fee = feeByStudentId.get(row.id);
                return fee ? <StatusBadge status={fee.status} /> : "—";
              },
            },
            {
              key: "feeAction",
              header: "Action",
              render: (row) => {
                const fee = feeByStudentId.get(row.id);
                if (!fee) return "—";
                return (
                  <button
                    onClick={() => (fee.status === "Paid" ? openEditStatus(fee) : openMarkPaid(fee))}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    {fee.status === "Paid" ? "Edit" : "Mark Paid"}
                  </button>
                );
              },
            },
            {
              key: "joinDate",
              header: "Join Date",
              render: (row) => new Date(row.joinDate).toLocaleDateString(),
            },
          ]}
          data={students}
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
    </div>
  );
}
