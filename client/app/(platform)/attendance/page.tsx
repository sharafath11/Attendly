"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, UserCheck2, UserX2, Download } from "lucide-react";
import AttendanceSummaryCard from "@/components/attendance/AttendanceSummaryCard";
import BatchAttendanceChart from "@/components/attendance/BatchAttendanceChart";
import LowAttendanceList from "@/components/attendance/LowAttendanceList";
import { useBatches } from "@/hooks/useBatches";
import {
  useBatchAttendanceSummary,
  useLowAttendanceStudents,
} from "@/hooks/useAttendance";
import { exportToCsv } from "@/utils/exportToCsv";

export default function AttendancePage() {
  const { data: batchesData } = useBatches();
  const batches = batchesData?.data?.batches ?? [];
  const [selectedBatchId, setSelectedBatchId] = useState("");

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  const { data: summaryData } = useBatchAttendanceSummary(selectedBatchId);
  const { data: lowAttendanceData } = useLowAttendanceStudents(selectedBatchId);

  const summary = summaryData?.data;
  const lowAttendanceStudents = lowAttendanceData?.data ?? [];

  const handleDownloadSummaryCsv = () => {
    if (!summary?.dailyTrend?.length) return;
    const rows = summary.dailyTrend.map((day: any) => ({
      Date: day.date,
      Present: day.present,
      Absent: day.absent,
      Total: day.total,
      AttendancePercent: day.attendancePercent,
    }));
    exportToCsv(
      `attendance-summary-${selectedBatch?.batchName ?? "batch"}`,
      rows,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Batch attendance insights for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batchName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AttendanceSummaryCard
          title="Batch Attendance"
          value={summary?.averageAttendance ?? 0}
          suffix="%"
          icon={<BarChart3 className="h-5 w-5" />}
          trend="Last 30 days"
        />
        <AttendanceSummaryCard
          title="Total Present"
          value={summary?.totalPresent ?? 0}
          icon={<UserCheck2 className="h-5 w-5" />}
          trend="Last 30 days"
        />
        <AttendanceSummaryCard
          title="Total Absent"
          value={summary?.totalAbsent ?? 0}
          icon={<UserX2 className="h-5 w-5" />}
          trend="Last 30 days"
        />
        </div>
        <button
          type="button"
          onClick={handleDownloadSummaryCsv}
          disabled={!summary?.dailyTrend?.length}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3 w-3" />
          Download Excel (CSV)
        </button>
      </div>

      <BatchAttendanceChart
        dailyTrend={summary?.dailyTrend ?? []}
        monthlyTrend={summary?.monthlyTrend ?? []}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Batch Selected</p>
              <p className="text-lg font-semibold text-foreground">
                {selectedBatch?.batchName ?? "Select a batch"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Mark attendance from the batch cards.
            </p>
          </div>
        </div>

        <LowAttendanceList students={lowAttendanceStudents} />
      </div>
    </div>
  );
}
