"use client";

import { useMemo, useRef, useState } from "react";
import { Filter, Plus } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  useBatches,
  useCreateBatch,
  useDeleteBatch,
  useUpdateBatch,
} from "@/hooks/useBatches";
import type { Batch, CreateBatchPayload } from "@/types/batches/batchTypes";

const mediumOptions = ["English", "Malayalam"] as const;
const sessionOptions = ["Morning", "Evening"] as const;

const filterOptions = {
  medium: ["All Mediums", ...mediumOptions],
  session: ["All Sessions", ...sessionOptions],
};

type BatchFormValues = {
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
};

const emptyForm: BatchFormValues = {
  batchName: "",
  classLevel: "",
  medium: mediumOptions[0],
  session: sessionOptions[0],
  scheduleTime: "",
  days: [],
};

const formatDays = (days: string[]) => days.join(" ");
const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function BatchesPage() {
  const [mediumFilter, setMediumFilter] = useState(filterOptions.medium[0]);
  const [sessionFilter, setSessionFilter] = useState(filterOptions.session[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [modalKey, setModalKey] = useState("new");
  const formRef = useRef<BatchFormValues>(emptyForm);
  const [daysSelection, setDaysSelection] = useState<string[]>(emptyForm.days);

  const filters = useMemo(
    () => ({
      medium: mediumFilter === "All Mediums" ? undefined : mediumFilter,
      session: sessionFilter === "All Sessions" ? undefined : sessionFilter,
    }),
    [mediumFilter, sessionFilter],
  );

  const { data, isLoading } = useBatches(filters);
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const batches = data?.data?.batches ?? [];

  const openAddModal = () => {
    setSelectedBatch(null);
    formRef.current = { ...emptyForm };
    setDaysSelection(emptyForm.days);
    setModalKey(`new-${Date.now()}`);
    setModalOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setSelectedBatch(batch);
    formRef.current = {
      batchName: batch.batchName,
      classLevel: batch.classLevel,
      medium: batch.medium,
      session: batch.session,
      scheduleTime: batch.scheduleTime,
      days: batch.days,
    };
    setDaysSelection(batch.days);
    setModalKey(`edit-${batch.id}`);
    setModalOpen(true);
  };

  const openDeleteConfirm = (batch: Batch) => {
    setSelectedBatch(batch);
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const current = formRef.current;

    const payload: CreateBatchPayload = {
      batchName: current.batchName.trim(),
      classLevel: current.classLevel.trim(),
      medium: current.medium.trim(),
      session: current.session.trim(),
      scheduleTime: current.scheduleTime.trim(),
      days: current.days,
    };

    if (
      !payload.batchName ||
      !payload.classLevel ||
      !payload.medium ||
      !payload.session ||
      !payload.scheduleTime ||
      payload.days.length === 0
    ) {
      showErrorToast("Please fill all required fields");
      return;
    }

    if (selectedBatch) {
      const res = await updateBatch.mutateAsync({ id: selectedBatch.id, payload });
      if (!res || !res.ok) {
        showErrorToast(res?.msg || "Failed to update batch");
        return;
      }
      showSuccessToast(res.msg || "Batch updated successfully");
    } else {
      const res = await createBatch.mutateAsync(payload);
      if (!res || !res.ok) {
        showErrorToast(res?.msg || "Failed to create batch");
        return;
      }
      showSuccessToast(res.msg || "Batch created successfully");
    }

    setModalOpen(false);
    setSelectedBatch(null);
    formRef.current = { ...emptyForm };
  };

  const handleDelete = async () => {
    if (!selectedBatch) return;

    const res = await deleteBatch.mutateAsync(selectedBatch.id);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to delete batch");
      return;
    }

    showSuccessToast(res.msg || "Batch deleted successfully");
    setConfirmOpen(false);
    setSelectedBatch(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground">Manage schedules and batch cohorts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={mediumFilter}
              onChange={(event) => setMediumFilter(event.target.value)}
              className="w-44 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
            >
              {filterOptions.medium.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sessionFilter}
              onChange={(event) => setSessionFilter(event.target.value)}
              className="w-44 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
            >
              {filterOptions.session.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Batch
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading batches...
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{batch.batchName}</h3>
                  <p className="text-xs text-muted-foreground">{batch.classLevel}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {batch.studentCount} Students
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="text-foreground">
                  {batch.medium} Medium
                </p>
                <p className="text-foreground">
                  {batch.session} Session
                </p>
                <p>
                  <span className="font-medium text-foreground">Schedule:</span> {batch.scheduleTime} | {formatDays(batch.days)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEditModal(batch)}
                  className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteConfirm(batch)}
                  className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
                >
                  Delete
                </button>
                <button className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                  View Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedBatch ? "Edit Batch" : "Add Batch"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Batch Name"
            placeholder="Grade 10"
            defaultValue={formRef.current.batchName}
            onChange={(event) => {
              formRef.current.batchName = event.target.value;
            }}
          />
          <FormInput
            label="Class Level"
            placeholder="Grade 10"
            defaultValue={formRef.current.classLevel}
            onChange={(event) => {
              formRef.current.classLevel = event.target.value;
            }}
          />
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Medium
            </span>
            <select
              defaultValue={formRef.current.medium}
              onChange={(event) => {
                formRef.current.medium = event.target.value;
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mediumOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Session
            </span>
            <select
              defaultValue={formRef.current.session}
              onChange={(event) => {
                formRef.current.session = event.target.value;
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sessionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <FormInput
            label="Schedule Time"
            placeholder="4:00 PM"
            defaultValue={formRef.current.scheduleTime}
            onChange={(event) => {
              formRef.current.scheduleTime = event.target.value;
            }}
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Days
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm text-foreground">
              {dayOptions.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 rounded-md border border-border bg-input px-2 py-2"
                >
                  <input
                    type="checkbox"
                    checked={daysSelection.includes(day)}
                    onChange={(event) => {
                      const next = new Set(daysSelection);
                      if (event.target.checked) {
                        next.add(day);
                      } else {
                        next.delete(day);
                      }
                      const nextDays = Array.from(next);
                      setDaysSelection(nextDays);
                      formRef.current.days = nextDays;
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={createBatch.isPending || updateBatch.isPending}
          >
            {selectedBatch ? "Save Changes" : "Save Batch"}
          </Button>
        </div>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete Batch">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete {selectedBatch?.batchName}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} isLoading={deleteBatch.isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
