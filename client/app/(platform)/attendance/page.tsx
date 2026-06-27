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
  const { data: batchesData, isLoading: batchesLoading } = useBatches();
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

  const { data: summaryData, isLoading: summaryLoading } = useBatchAttendanceSummary(selectedBatchId);
  const { data: lowAttendanceData, isLoading: lowAttendanceLoading } = useLowAttendanceStudents(selectedBatchId);

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

  const isDataLoading = batchesLoading || summaryLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Batch attendance insights for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3">
          {batchesLoading ? (
            <div className="h-9 w-40 animate-pulse bg-muted rounded-lg" />
          ) : (
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
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isDataLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-[120px] rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))
          ) : (
            <>
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
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleDownloadSummaryCsv}
          disabled={!summary?.dailyTrend?.length || isDataLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3 w-3" />
          Download Excel (CSV)
        </button>
      </div>

      {isDataLoading ? (
        <div className="h-[350px] rounded-xl border border-border bg-card p-6 animate-pulse flex items-end gap-3 justify-between">
          {Array.from({ length: 15 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-muted/60 rounded-t w-full transition-all duration-300"
              style={{ height: `${20 + (idx * 5) % 65}%` }}
            />
          ))}
        </div>
      ) : (
        <BatchAttendanceChart
          dailyTrend={summary?.dailyTrend ?? []}
          monthlyTrend={summary?.monthlyTrend ?? []}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Batch Selected</p>
              {isDataLoading ? (
                <div className="h-6 w-32 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <p className="text-lg font-semibold text-foreground">
                  {selectedBatch?.batchName ?? "Select a batch"}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Mark attendance from the batch cards.
            </p>
          </div>
        </div>

        {lowAttendanceLoading ? (
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse h-40" />
        ) : (
          <LowAttendanceList students={lowAttendanceStudents} />
        )}
      </div>
    </div>
  );
}
