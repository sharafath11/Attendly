"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBatches } from "@/hooks/useBatches";
import { examsService } from "@/services/exams.service";
import { Button } from "@/components/button";
import FormInput from "@/components/dashboard/FormInput";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useTeachers } from "@/hooks/useTeachers";
import { getRequest } from "@/services/api";
import { useEffect } from "react";

export default function CreateExamPage() {
  const router = useRouter();
  
  const { data: batchesData, isLoading } = useBatches();
  const batches = batchesData?.data?.batches || [];

  const [batchId, setBatchId] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [examName, setExamName] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bId = params.get("batchId");
      if (bId) setBatchId(bId);
    }
  }, []);

  const selectedBatch = batches.find((b) => b.id === batchId);
  const subjects = selectedBatch?.subjects || [];

  const { data: teachersResponse } = useTeachers();
  const teachers = teachersResponse?.data || [];

  const handleCreateExam = async () => {
    if (!batchId || !subject.trim() || !teacherId || !examName.trim() || !totalMarks.trim() || !date) {
      showErrorToast("Please fill all exam details including the teacher.");
      return;
    }

    const tMarks = Number(totalMarks);
    if (isNaN(tMarks) || tMarks <= 0) {
      showErrorToast("Total marks must be a valid positive number.");
      return;
    }

    setIsSubmitting(true);
    const res = await examsService.createExam({
      batchId,
      subject,
      teacherId,
      examName,
      totalMarks: tMarks,
      date,
    });
    setIsSubmitting(false);

    if (res?.ok) {
      showSuccessToast(res.msg || "Exam created and parents notified successfully!");
      // Removed redirect as requested, stay on page
    } else {
      showErrorToast(res?.msg || "Failed to create exam.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create New Exam</h1>
          <p className="text-sm text-muted-foreground">
            Schedule an exam for a batch. This will notify parents automatically.
          </p>
        </div>
        {batchId && (
          <button
            onClick={() => router.push(`/exams/${batchId}/results`)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            View Exams
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm text-muted-foreground sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Batch</span>
            <select
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value);
                setSubject("");
              }}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Select a batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batchName}</option>
              ))}
            </select>
          </label>

          <FormInput
            label="Exam Name"
            placeholder="e.g. Unit Test 1"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
          />
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!batchId}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign Teacher</span>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Select Teacher</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.customId})</option>
              ))}
            </select>
          </label>
          <FormInput
            label="Total Marks (Out of)"
            type="number"
            placeholder="e.g. 50"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
          />
          <FormInput
            label="Exam Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleCreateExam} isLoading={isSubmitting || isLoading}>
            Create Exam & Notify
          </Button>
        </div>
      </div>
    </div>
  );
}
