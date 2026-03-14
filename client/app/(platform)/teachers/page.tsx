"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { useSubscription } from "@/components/dashboard/SubscriptionContext";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  useCreateTeacher,
  useResetTeacherPassword,
  useTeachers,
  useUpdateTeacher,
  useUpdateTeacherStatus,
} from "@/hooks/useTeachers";
import type { CreateTeacherPayload, Teacher } from "@/types/teacher/teacherTypes";

type TeacherFormValues = {
  name: string;
  phone: string;
  salary: string;
};

const emptyForm: TeacherFormValues = {
  name: "",
  phone: "",
  salary: "",
};

const subjectOptions = [
  "Malayalam",
  "English",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Social Science",
  "Computer Science",
];

export default function TeachersPage() {
  const { isActive } = useSubscription();
  const { data, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const updateStatus = useUpdateTeacherStatus();
  const resetPassword = useResetTeacherPassword();

  const teacherList = data?.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [confirmTone, setConfirmTone] = useState<"default" | "warning" | "danger">("default");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [subjectSelection, setSubjectSelection] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "active" | "disabled">("All");
  const [sortOption, setSortOption] = useState<"name-asc" | "name-desc" | "newest" | "oldest">(
    "name-asc"
  );
  const formRef = useRef<TeacherFormValues>(emptyForm);

  const resetForm = () => {
    formRef.current = { ...emptyForm };
    setSubjectSelection([]);
    setCustomSubject("");
  };

  const openAddModal = () => {
    resetForm();
    setEditing(false);
    setSelectedTeacher(null);
    setModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    formRef.current = {
      name: teacher.name,
      phone: teacher.phone ?? "",
      salary: teacher.salary ? String(teacher.salary) : "",
    };
    setSubjectSelection(teacher.subjects ?? []);
    setEditing(true);
    setSelectedTeacher(teacher);
    setModalOpen(true);
  };

  const openViewModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setViewOpen(true);
  };

  const openConfirm = (config: {
    title: string;
    message: string;
    label?: string;
    tone?: "default" | "warning" | "danger";
    onConfirm: () => Promise<void>;
  }) => {
    setConfirmTitle(config.title);
    setConfirmMessage(config.message);
    setConfirmLabel(config.label ?? "Confirm");
    setConfirmTone(config.tone ?? "default");
    setConfirmAction(() => config.onConfirm);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction();
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSubmit = async () => {
    const payload: CreateTeacherPayload = {
      name: formRef.current.name.trim(),
      phone: formRef.current.phone.trim(),
      subjects: subjectSelection,
      salary: formRef.current.salary ? Number(formRef.current.salary) : undefined,
    };

    if (!payload.name || !payload.phone) {
      showErrorToast("Please fill all required fields");
      return;
    }

    if (editing && selectedTeacher) {
      const res = await updateTeacher.mutateAsync({ id: selectedTeacher.id, payload });
      if (!res || !res.ok) {
        showErrorToast(res?.msg || "Failed to update teacher");
        return;
      }
      showSuccessToast(res.msg || "Teacher updated successfully");
      setModalOpen(false);
      return;
    }

    const res = await createTeacher.mutateAsync(payload);
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to create teacher");
      return;
    }
    showSuccessToast(res.msg || "Teacher account created successfully");
    setGeneratedCredentials(res.data ?? null);
    setCredentialsOpen(true);
    setModalOpen(false);
  };

  const handleDeactivate = async (teacher: Teacher) => {
    if (!isActive) return;
    const res = await updateStatus.mutateAsync({ id: teacher.id, payload: { status: "disabled" } });
    if (!res || !res.ok) {
      showErrorToast(res?.msg || "Failed to deactivate teacher");
      return;
    }
    showSuccessToast(res.msg || "Teacher deactivated");
  };

  const handleResetPassword = async (teacher: Teacher) => {
    if (!isActive) return;
    openConfirm({
      title: "Reset Teacher Password",
      message: "Generate a new temporary password for this teacher?",
      label: "Reset",
      tone: "warning",
      onConfirm: async () => {
        const res = await resetPassword.mutateAsync(teacher.id);
        if (!res || !res.ok) {
          showErrorToast(res?.msg || "Failed to reset password");
          return;
        }
        showSuccessToast(res.msg || "Password reset successfully");
        setGeneratedCredentials(res.data ?? null);
        setCredentialsOpen(true);
      },
    });
  };

  const handleShowPassword = (teacher: Teacher) => {
    if (!generatedCredentials || generatedCredentials.username !== teacher.username) {
      showErrorToast("Password not available. Please reset to generate a new one.");
      return;
    }
    setCredentialsOpen(true);
  };

  const rows = useMemo(() => teacherList as Teacher[], [teacherList]);

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    teacherList.forEach((teacher) => {
      teacher.subjects?.forEach((subject) => subjects.add(subject));
    });
    return Array.from(subjects).sort();
  }, [teacherList]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = rows.filter((teacher) => {
      if (statusFilter !== "All" && teacher.status !== statusFilter) return false;
      if (subjectFilter !== "All" && !(teacher.subjects ?? []).includes(subjectFilter)) return false;
      if (!query) return true;
      const haystack = [
        teacher.name,
        teacher.username,
        teacher.phone ?? "",
        (teacher.subjects ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    switch (sortOption) {
      case "name-desc":
        filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
        break;
      default:
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [rows, searchQuery, statusFilter, subjectFilter, sortOption]);

  const toggleSubject = (subject: string) => {
    setSubjectSelection((prev) =>
      prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject]
    );
  };

  const handleAddCustomSubject = () => {
    const value = customSubject.trim();
    if (!value) return;
    setSubjectSelection((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomSubject("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Teachers</h1>
          <p className="text-sm text-muted-foreground">Manage teacher accounts and credentials.</p>
        </div>
        <Button onClick={openAddModal} className="gap-2" disabled={!isActive}>
          <Plus className="h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, username, phone, subject"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:w-64"
        />
        <select
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Subjects</option>
          {availableSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "All" | "active" | "disabled")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(event.target.value as "name-asc" | "name-desc" | "newest" | "oldest")
          }
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading teachers...
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "phone", header: "Phone" },
            { key: "username", header: "Username" },
            {
              key: "subjects",
              header: "Subjects",
              render: (row) => (
                <span className="text-xs text-muted-foreground">
                  {row.subjects && row.subjects.length > 0 ? row.subjects.join(", ") : "—"}
                </span>
              ),
            },
            {
              key: "salary",
              header: "Salary",
              render: (row) => (row.salary ? `₹${row.salary.toLocaleString()}` : "—"),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {row.status}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openViewModal(row)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(row)}
                    disabled={!isActive}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleShowPassword(row)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    Show Password
                  </button>
                  <button
                    onClick={() => handleResetPassword(row)}
                    disabled={!isActive}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleDeactivate(row)}
                    disabled={!isActive || row.status === "disabled"}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredRows}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Teacher" : "Add Teacher"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Name"
            placeholder="Anitha"
            defaultValue={formRef.current.name}
            onChange={(event) => {
              formRef.current.name = event.target.value;
            }}
          />
          <FormInput
            label="Phone"
            placeholder="9999999999"
            defaultValue={formRef.current.phone}
            onChange={(event) => {
              formRef.current.phone = event.target.value;
            }}
          />
          <FormInput
            label="Salary (Monthly)"
            placeholder="12000"
            type="number"
            defaultValue={formRef.current.salary}
            onChange={(event) => {
              formRef.current.salary = event.target.value;
            }}
          />
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-foreground">Subjects</p>
            <p className="text-xs text-muted-foreground">Select the subjects this teacher can handle.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjectOptions.map((subject) => {
                const active = subjectSelection.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={customSubject}
                onChange={(event) => setCustomSubject(event.target.value)}
                placeholder="Add custom subject"
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
              />
              <Button variant="secondary" onClick={handleAddCustomSubject} type="button">
                Add Subject
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={createTeacher.isPending || updateTeacher.isPending}
            disabled={!isActive}
          >
            {editing ? "Save" : "Create"}
          </Button>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Teacher Details">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="text-xs uppercase tracking-wide">Name</p>
            <p className="text-sm font-medium text-foreground">{selectedTeacher?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Phone</p>
            <p className="text-sm font-medium text-foreground">{selectedTeacher?.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Username</p>
            <p className="text-sm font-medium text-foreground">{selectedTeacher?.username ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Subjects</p>
            <p className="text-sm font-medium text-foreground">
              {selectedTeacher?.subjects && selectedTeacher.subjects.length > 0
                ? selectedTeacher.subjects.join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Salary</p>
            <p className="text-sm font-medium text-foreground">
              {selectedTeacher?.salary ? `₹${selectedTeacher.salary.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setViewOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <Modal open={credentialsOpen} onClose={() => setCredentialsOpen(false)} title="Teacher Credentials">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Please share these credentials with the teacher.</p>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide">Username</p>
            <p className="text-sm font-medium text-foreground">{generatedCredentials?.username ?? "—"}</p>
            <p className="mt-3 text-xs uppercase tracking-wide">Temporary Password</p>
            <p className="text-sm font-medium text-foreground">
              {generatedCredentials?.temporaryPassword ?? "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setCredentialsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={confirmLabel}
        tone={confirmTone}
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}
