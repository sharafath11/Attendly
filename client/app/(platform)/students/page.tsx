"use client";

import { useMemo, useRef, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import DataTable from "@/components/dashboard/DataTable";
import Modal from "@/components/dashboard/Modal";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  useCreateStudent,
  useDeleteStudent,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useStudents";
import type { CreateStudentPayload, Student } from "@/types/students/studentTypes";

type StudentFormValues = {
  name: string;
  phone: string;
  parentPhone: string;
  batchId: string;
  monthlyFee: string;
  joinDate: string;
};

const emptyForm: StudentFormValues = {
  name: "",
  phone: "",
  parentPhone: "",
  batchId: "",
  monthlyFee: "",
  joinDate: "",
};

const toInputDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All Batches");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalKey, setModalKey] = useState("new");
  const formRef = useRef<StudentFormValues>(emptyForm);

  const studentsQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      batchId: batchFilter === "All Batches" ? undefined : batchFilter,
      page: 1,
      limit: 10,
    }),
    [search, batchFilter],
  );

  const { data, isLoading } = useStudents(studentsQuery);

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const students = data?.data?.students ?? [];

  const batchOptions = useMemo(() => {
    const unique = new Set(students.map((student) => student.batchId));
    return ["All Batches", ...Array.from(unique)];
  }, [students]);

  const openAddModal = () => {
    setSelectedStudent(null);
    formRef.current = { ...emptyForm };
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
    setModalKey(`edit-${student.id}`);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const current = formRef.current;
    const payload: CreateStudentPayload = {
      name: current.name.trim(),
      phone: current.phone.trim(),
      parentPhone: current.parentPhone.trim() || undefined,
      batchId: current.batchId.trim(),
      monthlyFee: Number(current.monthlyFee) || 0,
      joinDate: current.joinDate,
    };

    if (!payload.name || !payload.phone || !payload.batchId || !payload.joinDate) {
      showErrorToast("Please fill all required fields");
      return;
    }

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
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={openAddModal} className="gap-2">
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
            { key: "name", header: "Student Name" },
            { key: "phone", header: "Phone" },
            { key: "parentPhone", header: "Parent Phone" },
            { key: "batchId", header: "Batch" },
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
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(row)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"
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
            onChange={(event) => {
              formRef.current.name = event.target.value;
            }}
          />
          <FormInput
            label="Phone"
            placeholder="+91"
            defaultValue={formRef.current.phone}
            onChange={(event) => {
              formRef.current.phone = event.target.value;
            }}
          />
          <FormInput
            label="Parent Phone"
            placeholder="+91"
            defaultValue={formRef.current.parentPhone}
            onChange={(event) => {
              formRef.current.parentPhone = event.target.value;
            }}
          />
          <FormInput
            label="Batch"
            placeholder="Batch ID"
            defaultValue={formRef.current.batchId}
            onChange={(event) => {
              formRef.current.batchId = event.target.value;
            }}
          />
          <FormInput
            label="Monthly Fee"
            placeholder="₹"
            type="number"
            defaultValue={formRef.current.monthlyFee}
            onChange={(event) => {
              formRef.current.monthlyFee = event.target.value;
            }}
          />
          <FormInput
            label="Join Date"
            type="date"
            defaultValue={formRef.current.joinDate}
            onChange={(event) => {
              formRef.current.joinDate = event.target.value;
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
