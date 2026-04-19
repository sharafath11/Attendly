"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SettingsToggleRow from "@/components/product/SettingsToggleRow";
import { Button } from "@/components/button";
import { automationApi } from "@/services/automation.api";

export default function AutomationPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["automation-settings"],
    queryFn: async () => {
      const res = await automationApi.getSettings();
      if (!res?.ok) throw new Error("load failed");
      return res.data;
    },
  });

  const [monthlyFees, setMonthlyFees] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [autoAbsent, setAutoAbsent] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);

  useEffect(() => {
    if (!data) return;
    setMonthlyFees(Boolean(data.autoFeeGeneration));
    setReminders(Boolean(data.feeReminderEnabled));
    setAutoAbsent(Boolean(data.attendanceAutoDefaultAbsent));
    setReminderDays(typeof data.reminderDaysBefore === "number" ? data.reminderDaysBefore : 3);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      automationApi.patchSettings({
        autoFeeGeneration: monthlyFees,
        feeReminderEnabled: reminders,
        attendanceAutoDefaultAbsent: autoAbsent,
        reminderDaysBefore: reminderDays,
      }),
    onSuccess: (res) => {
      const ok = res && typeof res === "object" && "ok" in res ? (res as { ok?: boolean }).ok : true;
      if (ok) {
        toast.success("Saved to your center.");
        qc.invalidateQueries({ queryKey: ["automation-settings"] });
      } else toast.error("Could not save");
    },
    onError: () => toast.error("Could not save"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading automation…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Automation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn on what you want Attendly to handle for you. Plain language — no technical setup.
        </p>
      </div>

      <div className="space-y-3">
        <SettingsToggleRow
          title="Create monthly fees automatically"
          description="On the 1st of each month (server job), we generate pending fee rows for active students."
          checked={monthlyFees}
          onCheckedChange={setMonthlyFees}
        />
        <SettingsToggleRow
          title="Send fee reminders for me"
          description="Sends WhatsApp fee reminders for pending monthly fees (uses your Twilio / 360dialog setup)."
          checked={reminders}
          onCheckedChange={setReminders}
        />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <label className="text-sm font-medium text-foreground">Reminder window (days before month-end)</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Higher number starts reminders earlier in the month.
          </p>
          <input
            type="number"
            min={0}
            max={28}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base"
            value={reminderDays}
            onChange={(e) => setReminderDays(Number(e.target.value))}
          />
        </div>
        <SettingsToggleRow
          title="Mark “absent” if attendance isn’t taken"
          description="End-of-day job: if a batch meets today and there is no attendance row, we mark absent."
          checked={autoAbsent}
          onCheckedChange={setAutoAbsent}
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Why this matters:</span> every switch here either saves you time
          or helps fees come in on time.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        isLoading={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        Save preferences
      </Button>
    </div>
  );
}
