"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  useCreateStudent,
  useDeleteStudent,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useStudents";
import { useBatches } from "@/hooks/useBatches";
import type { CreateStudentPayload, Student } from "@/types/students/studentTypes";

type StudentFormValues = {
  name: string;
  phone: string;
  parentPhone: string;
  batchId: string;
  monthlyFee: string;
  joinDate: string;
};

type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

const emptyForm: StudentFormValues = {
  name: "",
  phone: "",
  parentPhone: "",
  batchId: "",
  monthlyFee: "",
  joinDate: "",
};

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

const toInputDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export default function StudentsPage() {
  const { isActive } = useSubscription();
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All Batches");
  const [sessionFilter, setSessionFilter] = useState("All Sessions");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalKey, setModalKey] = useState("new");
  const formRef = useRef<StudentFormValues>(emptyForm);
  const [formErrors, setFormErrors] = useState<StudentFormErrors>({});

  const studentsQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      batchId: batchFilter === "All Batches" ? undefined : batchFilter,
      session: sessionFilter === "All Sessions" ? undefined : sessionFilter,
      page: 1,
      limit: 10,
    }),
    [search, batchFilter, sessionFilter],
  );

  const { data, isLoading } = useStudents(studentsQuery);
  const { data: batchesData } = useBatches();

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const students = data?.data?.students ?? [];
  const batches = batchesData?.data?.batches ?? [];

  const batchNameById = useMemo(() => {
    const map = new Map<string, string>();
    batches.forEach((batch) => {
      map.set(batch.id, batch.batchName);
    });
    return map;
  }, [batches]);

  const batchOptions = useMemo(() => {
    const unique = new Map<string, string>();
    batches.forEach((batch) => {
      unique.set(batch.id, batch.batchName);
    });
    return [
      { value: "All Batches", label: "All Batches" },
      ...Array.from(unique.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [batches]);

  const sessionOptions = useMemo(() => {
    const unique = new Set(batches.map((batch) => batch.session).filter(Boolean));
    return ["All Sessions", ...Array.from(unique)];
  }, [batches]);

  const openAddModal = () => {
    setSelectedStudent(null);
    formRef.current = { ...emptyForm };
    setFormErrors({});
    setModalKey(`new-${Date.now()}`);
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    formRef.current = {
      name: student.name,
      phone: student.phone,
      parentPhone: student.parentPhone || "",
      batchId: student.batchId,
      monthlyFee: String(student.monthlyFee ?? ""),
      joinDate: toInputDate(student.joinDate),
    };
    setFormErrors({});
    setModalKey(`edit-${student.id}`);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const current = formRef.current;
    const nextErrors: StudentFormErrors = {};

    if (!current.name.trim()) {
      nextErrors.name = "Student name is required";
    }

    if (!current.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(current.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (current.parentPhone.trim() && !PHONE_REGEX.test(current.parentPhone.trim())) {
      nextErrors.parentPhone = "Enter a valid parent phone number";
    }

    if (!current.batchId.trim()) {
      nextErrors.batchId = "Please select a batch";
    }

    if (!current.monthlyFee.trim()) {
      nextErrors.monthlyFee = "Monthly fee is required";
    } else if (Number.isNaN(Number(current.monthlyFee)) || Number(current.monthlyFee) < 0) {
      nextErrors.monthlyFee = "Monthly fee must be a valid number";
    }

    if (!current.joinDate.trim()) {
      nextErrors.joinDate = "Join date is required";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      showErrorToast("Please fix the highlighted fields");
      return;
    }

    const payload: CreateStudentPayload = {
      name: current.name.trim(),
      phone: current.phone.trim(),
      parentPhone: current.parentPhone.trim() || undefined,
      batchId: current.batchId.trim(),
      monthlyFee: Number(current.monthlyFee) || 0,
      joinDate: current.joinDate,
    };

    if (selectedStudent) {
      const res = await updateStudent.mutateAsync({ id: selectedStudent.id, payload });
      if (!res || !res.ok) {
        showErrorToast(res?.msg || "Failed to update student");
        return;
      }
      showSuccessToast(res.msg || "Student updated successfully");
    } else {
      const res = await createStudent.mutateAsync(payload);
      if (!res || !res.ok) {
        showErrorToast(res?.msg || "Failed to create student");
        return;
      }
      showSuccessToast(res.msg || "Student created successfully");
    }

    setModalOpen(false);
    setSelectedStudent(null);
    formRef.current = { ...emptyForm };
    setFormErrors({});
  };

  const openDeleteConfirm = (student: Student) => {
    setSelectedStudent(student);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    const res = await deleteStudent.mutateAsync(selectedStudent.id);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to delete student");
      return;
    }

    showSuccessToast(res.msg || "Student deleted successfully");
    setConfirmOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student profiles and enrollment.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search students"
              placeholder="Search students"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="w-48 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
            >
              {batchOptions.map((batch) => (
                <option key={batch.value} value={batch.value}>
                  {batch.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sessionFilter}
              onChange={(event) => setSessionFilter(event.target.value)}
              className="w-48 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
            >
              {sessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={openAddModal} className="gap-2" disabled={!isActive}>
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading students...
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Student Name",
              render: (row) => (
                <Link href={`/students/${row.id}`} className="text-sm font-medium text-foreground hover:underline">
                  {row.name}
                </Link>
              ),
            },
            { key: "phone", header: "Phone" },
            { key: "parentPhone", header: "Parent Phone" },
            {
              key: "batchId",
              header: "Batch",
              render: (row) => batchNameById.get(row.batchId) ?? "Unknown",
            },
            {
              key: "monthlyFee",
              header: "Monthly Fee",
              render: (row) => `₹${row.monthlyFee.toLocaleString()}`,
            },
            {
              key: "joinDate",
              header: "Join Date",
              render: (row) => new Date(row.joinDate).toLocaleDateString(),
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(row)}
                    disabled={!isActive}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(row)}
                    disabled={!isActive}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={students}
        />
      )}

      <Modal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedStudent ? "Edit Student" : "Add Student"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Student Name"
            placeholder="Enter name"
            defaultValue={formRef.current.name}
            error={formErrors.name}
            onChange={(event) => {
              formRef.current.name = event.target.value;
              if (formErrors.name) {
                setFormErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
          />
          <FormInput
            label="Phone"
            placeholder="+91"
            defaultValue={formRef.current.phone}
            error={formErrors.phone}
            onChange={(event) => {
              formRef.current.phone = event.target.value;
              if (formErrors.phone) {
                setFormErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
          />
          <FormInput
            label="Parent Phone"
            placeholder="+91"
            defaultValue={formRef.current.parentPhone}
            error={formErrors.parentPhone}
            onChange={(event) => {
              formRef.current.parentPhone = event.target.value;
              if (formErrors.parentPhone) {
                setFormErrors((prev) => ({ ...prev, parentPhone: undefined }));
              }
            }}
          />
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Batch
            </span>
            <select
              defaultValue={formRef.current.batchId}
              onChange={(event) => {
                formRef.current.batchId = event.target.value;
                if (formErrors.batchId) {
                  setFormErrors((prev) => ({ ...prev, batchId: undefined }));
                }
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a batch
              </option>
              {batchOptions
                .filter((option) => option.value !== "All Batches")
                .map((batch) => (
                  <option key={batch.value} value={batch.value}>
                    {batch.label}
                  </option>
                ))}
            </select>
            {formErrors.batchId && (
              <span className="text-xs text-destructive">{formErrors.batchId}</span>
            )}
          </label>
          <FormInput
            label="Monthly Fee"
            placeholder="₹"
            type="number"
            defaultValue={formRef.current.monthlyFee}
            error={formErrors.monthlyFee}
            onChange={(event) => {
              formRef.current.monthlyFee = event.target.value;
              if (formErrors.monthlyFee) {
                setFormErrors((prev) => ({ ...prev, monthlyFee: undefined }));
              }
            }}
          />
          <FormInput
            label="Join Date"
            type="date"
            defaultValue={formRef.current.joinDate}
            error={formErrors.joinDate}
            onChange={(event) => {
              formRef.current.joinDate = event.target.value;
              if (formErrors.joinDate) {
                setFormErrors((prev) => ({ ...prev, joinDate: undefined }));
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={createStudent.isPending || updateStudent.isPending}
          >
            {selectedStudent ? "Save Changes" : "Save Student"}
          </Button>
        </div>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete Student">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete {selectedStudent?.name}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} isLoading={deleteStudent.isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
