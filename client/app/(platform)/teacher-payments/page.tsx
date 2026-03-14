"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useTeachers } from "@/hooks/useTeachers";
import { useCreateTeacherPayment, useTeacherPayments } from "@/hooks/useTeacherPayments";
import type {
  CreateTeacherPaymentPayload,
  TeacherPayment,
} from "@/types/teacherPayments/teacherPaymentsTypes";

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

const getCurrentYear = () => new Date().getFullYear();

type PaymentFormValues = {
  teacherId: string;
  amount: string;
  month: string;
  year: string;
  notes: string;
};

const emptyForm: PaymentFormValues = {
  teacherId: "",
  amount: "",
  month: monthNames[new Date().getMonth()],
  year: String(getCurrentYear()),
  notes: "",
};

export default function TeacherPaymentsPage() {
  const { isActive } = useSubscription();
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>(String(getCurrentYear()));

  const filters = useMemo(
    () => ({
      teacherId: teacherFilter === "All" ? undefined : teacherFilter,
      month: monthFilter === "All" ? undefined : monthFilter,
      year: yearFilter === "All" ? undefined : Number(yearFilter),
    }),
    [teacherFilter, monthFilter, yearFilter]
  );

  const { data: paymentsData, isLoading } = useTeacherPayments(filters);
  const payments = paymentsData?.data ?? [];
  const createPayment = useCreateTeacherPayment();

  const formRef = useRef<PaymentFormValues>({ ...emptyForm });

  const openModal = () => {
    formRef.current = { ...emptyForm };
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload: CreateTeacherPaymentPayload = {
      teacherId: formRef.current.teacherId,
      amount: Number(formRef.current.amount),
      month: formRef.current.month,
      year: Number(formRef.current.year),
      notes: formRef.current.notes.trim() || undefined,
    };

    if (!payload.teacherId || !payload.amount || !payload.month || !payload.year) {
      showErrorToast("Please fill all required fields");
      return;
    }

    const res = await createPayment.mutateAsync(payload);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to record payment");
      return;
    }
    showSuccessToast(res.msg || "Payment recorded");
    setModalOpen(false);
  };

  const rows = useMemo(() => payments as TeacherPayment[], [payments]);
  const yearOptions = [getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Teacher Payments</h1>
          <p className="text-sm text-muted-foreground">Track salary and payment records.</p>
        </div>
        <Button onClick={openModal} className="gap-2" disabled={!isActive}>
          <Plus className="h-4 w-4" /> Record Payment
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={teacherFilter}
          onChange={(event) => setTeacherFilter(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Teachers</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Months</option>
          {monthNames.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Years</option>
          {yearOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading payments...
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "teacher",
              header: "Teacher",
              render: (row) => row.teacher?.name ?? "—",
            },
            { key: "month", header: "Month" },
            { key: "year", header: "Year" },
            {
              key: "amount",
              header: "Amount",
              render: (row) => `₹${row.amount.toLocaleString()}`,
            },
            {
              key: "paidDate",
              header: "Paid Date",
              render: (row) => (row.paidDate ? new Date(row.paidDate).toLocaleDateString() : "—"),
            },
            {
              key: "notes",
              header: "Notes",
              render: (row) => (
                <span className="text-xs text-muted-foreground">{row.notes?.trim() || "—"}</span>
              ),
            },
          ]}
          data={rows}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Teacher Payment">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teacher</span>
            <select
              defaultValue={formRef.current.teacherId}
              onChange={(event) => {
                formRef.current.teacherId = event.target.value;
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
          <FormInput
            label="Amount"
            placeholder="12000"
            type="number"
            defaultValue={formRef.current.amount}
            onChange={(event) => {
              formRef.current.amount = event.target.value;
            }}
          />
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</span>
            <select
              defaultValue={formRef.current.month}
              onChange={(event) => {
                formRef.current.month = event.target.value;
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {monthNames.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Year</span>
            <select
              defaultValue={formRef.current.year}
              onChange={(event) => {
                formRef.current.year = event.target.value;
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {yearOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
            <textarea
              defaultValue={formRef.current.notes}
              onChange={(event) => {
                formRef.current.notes = event.target.value;
              }}
              rows={3}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={createPayment.isPending} disabled={!isActive}>
            Save Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
