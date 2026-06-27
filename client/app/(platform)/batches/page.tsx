"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus } from "lucide-react";
import Modal from "@/components/dashboard/Modal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  useBatches,
  useCreateBatch,
  useDeleteBatch,
  useUpdateBatch,
} from "@/hooks/useBatches";
import BatchCard from "@/components/batches/BatchCard";
import type { Batch, CreateBatchPayload } from "@/types/batches/batchTypes";
import { useAuth } from "@/context/AuthContext";

import { useQuery } from "@tanstack/react-query";
import { centersService } from "@/services/centers.service";

const defaultMediumOptions = ["English", "Malayalam"];
const defaultSessionOptions = ["Morning", "Evening"];

type BatchFormValues = {
  batchName: string;
  classLevel: string;
  medium: string;
  session: string;
  scheduleTime: string;
  days: string[];
  subjects: string;
};

const emptyForm: BatchFormValues = {
  batchName: "",
  classLevel: "",
  medium: "",
  session: "",
  scheduleTime: "",
  days: [],
  subjects: "",
};

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function parseTimeForInput(timeStr: string) {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return timeStr;
    let [hours, minutes] = time.split(":");
    if (hours === "12") hours = "00";
    if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, "0")}:${minutes}`;
  }
  return timeStr;
}

function formatTimeForSubmit(timeStr: string) {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const modifier = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${modifier}`;
}


export default function BatchesPage() {
  const { isActive } = useSubscription();
  const { isOwner } = useAuth();
  const router = useRouter();
  const [mediumFilter, setMediumFilter] = useState("All Mediums");
  const [sessionFilter, setSessionFilter] = useState("All Sessions");
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

  const displayBatches = useMemo(() => {
    return batches;
  }, [batches]);

  const { data: centerResponse } = useQuery({
    queryKey: ["currentCenter"],
    queryFn: async () => {
      const res = await centersService.getMyCenter();
      return res?.ok ? res.data : null;
    },
  });

  const mediumOptions = centerResponse?.mediums?.length > 0 ? centerResponse.mediums : defaultMediumOptions;
  const sessionOptions = centerResponse?.sessions?.length > 0 ? centerResponse.sessions : defaultSessionOptions;

  const filterOptions = useMemo(() => ({
    medium: ["All Mediums", ...mediumOptions],
    session: ["All Sessions", ...sessionOptions],
  }), [mediumOptions, sessionOptions]);

  // Ensure default selects are populated when adding
  const openAddModal = () => {
    setSelectedBatch(null);
    formRef.current = { ...emptyForm, medium: mediumOptions[0] || "", session: sessionOptions[0] || "" };
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
      scheduleTime: parseTimeForInput(batch.scheduleTime),
      days: batch.days,
      subjects: batch.subjects?.join(", ") || "",
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
      scheduleTime: formatTimeForSubmit(current.scheduleTime.trim()),
      days: current.days,
      subjects: current.subjects.split(",").map(s => s.trim()).filter(Boolean),
    };

    if (
      !payload.batchName ||
      !payload.classLevel ||
      !payload.medium ||
      !payload.session ||
      !payload.scheduleTime ||
      payload.days.length === 0 ||
      payload.subjects.length === 0
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
          {isOwner && (
            <Button onClick={openAddModal} className="gap-2" disabled={!isActive}>
              <Plus className="h-4 w-4" /> Add Batch
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading batches...
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
              onViewStudents={(selected) => router.push(`/batches/${selected.id}/students`)}
              onMarkAttendance={(selected) => router.push(`/attendance/${selected.id}`)}
              onAddExamMark={(selected) => router.push(`/exams/${selected.id}`)}
              onCreateExam={(selected) => router.push(`/exams/create?batchId=${selected.id}`)}
              onViewExams={(selected) => router.push(`/exams/${selected.id}/results`)}
              actionsDisabled={!isActive}
              attendanceDisabled={!isActive}
              isOwner={isOwner}
            />
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
            type="time"
            label="Schedule Time"
            placeholder="4:00 PM"
            defaultValue={formRef.current.scheduleTime}
            onChange={(event) => {
              formRef.current.scheduleTime = event.target.value;
            }}
          />
          <FormInput
            label="Subjects (Comma separated)"
            placeholder="e.g. Mathematics, Physics"
            defaultValue={formRef.current.subjects}
            onChange={(event) => {
              formRef.current.subjects = event.target.value;
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
