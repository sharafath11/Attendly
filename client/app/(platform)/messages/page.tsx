"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Megaphone,
  MessageCircle,
  Send,
  Users,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import * as Switch from "@radix-ui/react-switch";
import { whatsappApi } from "@/services/whatsapp.api";
import { parentApi } from "@/services/parent.api";
import { useBatches } from "@/hooks/useBatches";
import { automationApi } from "@/services/automation.api";

type Thread = {
  id: string;
  title: string;
  preview: string;
  time: string;
  unread?: boolean;
};

const threads: Thread[] = [
  {
    id: "1",
    title: "Fee reminders · Grade 10",
    preview: "Hi parents, May fee is due on May 1…",
    time: "9:14 AM",
    unread: true,
  },
  {
    id: "2",
    title: "Attendance · Evening batch",
    preview: "Your child was present today.",
    time: "Yesterday",
  },
  {
    id: "3",
    title: "Broadcast · Holiday",
    preview: "Center closed on Apr 21. Classes resume Apr 22.",
    time: "Mon",
  },
];

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const [activeId, setActiveId] = useState(threads[0].id);
  const [targetAudience, setTargetAudience] = useState("parents");
  const [batchId, setBatchId] = useState("");
  const [draft, setDraft] = useState("Hi {{parent_name}}, ");
  const { data: batchesData } = useBatches({});
  
  const sendBroadcastMutation = useMutation({
    mutationFn: () => parentApi.universalBroadcast(targetAudience, draft, targetAudience === "batch" ? batchId : undefined),
    onSuccess: (res: any) => {
      if (res?.ok) {
        toast.success(res?.msg || "Broadcast sent successfully");
        setDraft("");
      } else {
        toast.error(res?.msg || "Failed to send broadcast");
      }
    },
    onError: (err: any) => toast.error(err?.message || "Failed to send broadcast"),
  });
  
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  // --- Automation Settings ---
  const { data: automationData, isLoading: isAutomationLoading } = useQuery({
    queryKey: ["automation-settings"],
    queryFn: async () => {
      const res = await automationApi.getSettings();
      if (!res?.ok) throw new Error("Load failed");
      return res.data;
    },
  });

  const [monthlyFees, setMonthlyFees] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [reminderDaysList, setReminderDaysList] = useState("5, 10, 25");

  useEffect(() => {
    if (!automationData) return;
    setMonthlyFees(Boolean(automationData.autoFeeGeneration));
    setReminders(Boolean(automationData.feeReminderEnabled));
    setReminderDays(typeof automationData.reminderDaysBefore === "number" ? automationData.reminderDaysBefore : 3);
    if (Array.isArray(automationData.feeReminderDays)) {
      setReminderDaysList(automationData.feeReminderDays.join(", "));
    }
  }, [automationData]);

  const saveSettingsMutation = useMutation({
    mutationFn: () => {
      const daysArray = reminderDaysList
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
      return automationApi.patchSettings({
        autoFeeGeneration: monthlyFees,
        feeReminderEnabled: reminders,
        reminderDaysBefore: reminderDays,
        feeReminderDays: daysArray,
      });
    },
    onSuccess: (res: any) => {
      if (res?.ok) {
        toast.success(res?.msg || "Preferences updated successfully");
        queryClient.invalidateQueries({ queryKey: ["automation-settings"] });
      } else {
        toast.error(res?.msg || "Failed to update preferences");
      }
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update preferences"),
  });

  // --- WhatsApp Connection Settings ---
  const { data: waStatusData, refetch: refetchStatus, isFetching: isFetchingStatus } = useQuery({
    queryKey: ["wa-status"],
    queryFn: async () => {
      const res = await whatsappApi.getStatus();
      return res?.ok && res.data ? res.data : null;
    },
    refetchInterval: 10000, // Poll status every 10 seconds
  });

  const waStatus = waStatusData?.status || "closed";

  const { data: waQrData, refetch: refetchQr, isFetching: isFetchingQr } = useQuery({
    queryKey: ["wa-qr"],
    queryFn: async () => {
      const res = await whatsappApi.getQr();
      return res?.ok && res.data ? res.data : null;
    },
    enabled: waStatus !== "open", // Only fetch QR if not connected
    refetchInterval: (query) => (query.state.data?.qr ? false : 5000), // Poll every 5s until QR is available
  });

  const handleRefreshConnection = () => {
    refetchStatus();
    refetchQr();
    toast.info("Refreshing connection state...");
  };

  const sendPreview = () => {
    if (!draft.trim()) {
      toast.message("Type a message first");
      return;
    }
    if (targetAudience === "batch" && !batchId) {
      toast.message("Please select a batch first");
      return;
    }
    sendBroadcastMutation.mutate();
  };
  const _discard_sendPreview = () => {
    if (!draft.trim()) {
      toast.message("Type a short message first");
      return;
    }
    if (waStatus === "open") {
      toast.success("Preview queue triggered via connected WhatsApp.");
    } else {
      toast.success("Preview sent — connect WhatsApp to deliver for real.");
    }
    setDraft("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
            </span>
            Connected
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
            Initializing
          </span>
        );
      case "qr":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <QrCode className="h-3.5 w-3.5 text-white" />
            Scan QR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <XCircle className="h-3.5 w-3.5 text-white" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Communications</h1>
          <p className="text-sm text-muted-foreground">Manage broadcast messages and automated WhatsApp reminders.</p>
        </div>

        <div className="flex items-center rounded-xl bg-muted p-1 border border-border">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "chat" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat Hub
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === "settings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            WhatsApp Setup
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        <div className="mx-auto flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex flex-1 flex-col rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Bulk Broadcast</h2>
              <p className="text-sm text-muted-foreground mt-1">Send customized WhatsApp messages to specific audiences.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Target Audience</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: "parents", label: "All Parents", icon: Users },
                    { id: "teachers", label: "All Teachers", icon: Users },
                    { id: "batch", label: "Specific Batch", icon: Users },
                    { id: "all", label: "Entire Center", icon: Megaphone },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTargetAudience(option.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition",
                        targetAudience === option.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <option.icon className="h-5 w-5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {targetAudience === "batch" && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Select Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus-visible:outline-primary"
                  >
                    <option value="">-- Choose a Batch --</option>
                    {batchesData?.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName} ({b.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Message</label>
                <div className="flex flex-wrap gap-2 pb-2">
                  <QuickChip icon={Megaphone} label="{{parent_name}}" onClick={() => setDraft(d => d + "{{parent_name}}")} />
                  <QuickChip icon={Users} label="{{student_name}}" onClick={() => setDraft(d => d + "{{student_name}}")} />
                  <QuickChip icon={Users} label="{{teacher_name}}" onClick={() => setDraft(d => d + "{{teacher_name}}")} />
                </div>
                <div className="relative">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[160px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-primary"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                    Supports variables
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <div className="text-sm">
                  {getStatusBadge(waStatus)}
                </div>
                <Button
                  type="button"
                  onClick={sendPreview}
                  disabled={waStatus !== "open" || sendBroadcastMutation.isPending}
                  isLoading={sendBroadcastMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Broadcast
                </Button>
              </div>
            </div>
          </section>
        </div>      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* WhatsApp Connection Control */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">WhatsApp Connection</h2>
                  <p className="text-xs text-muted-foreground">Scan QR code using WhatsApp on your phone to link your center.</p>
                </div>
                <button
                  onClick={handleRefreshConnection}
                  disabled={isFetchingStatus || isFetchingQr}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary transition disabled:opacity-50"
                  title="Refresh Status"
                >
                  <RefreshCw className={cn("h-4 w-4", (isFetchingStatus || isFetchingQr) && "animate-spin")} />
                </button>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center space-y-4 py-4">
                {waStatus === "open" ? (
                  <div className="text-center space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">WhatsApp Linked Successfully</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Your tuition center is connected. Reminders and messages will be sent automatically.
                    </p>
                  </div>
                ) : waStatus === "connecting" ? (
                  <div className="text-center space-y-6 py-6">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-1000"></div>
                      <div className="absolute inset-2 animate-pulse rounded-full bg-primary/30"></div>
                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-primary/20">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Initializing WhatsApp Web
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                        Booting secure local session. Please wait up to 20 seconds for the engine to warm up.
                      </p>
                    </div>
                  </div>
                ) : waStatus === "qr" && waQrData?.qr ? (
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-xl border border-border shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={waQrData.qr}
                        alt="WhatsApp QR Code"
                        className="mx-auto h-48 w-48 object-contain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-foreground">Scan with your Phone</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Open WhatsApp on your mobile, go to Linked Devices, and scan this QR code to sync.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-6">
                    <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
                    <h3 className="text-base font-bold text-foreground">Session Closed</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Click refresh or scan QR to initiate connection for message automation.
                    </p>
                    <Button onClick={handleRefreshConnection} size="sm" className="mt-2">
                      Initialize Session
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground flex items-start gap-1.5">
              <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground/80" />
              <span>
                Make sure your phone remains connected to the internet. We run an automated queue worker to safely deliver your fee receipts and absent alerts.
              </span>
            </div>
          </div>

          {/* Messages & Reminders Settings */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-semibold text-foreground">Auto-Messaging Settings</h2>
                <p className="text-xs text-muted-foreground">Control trigger windows and message generation dates.</p>
              </div>

              <div className="mt-4 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Send automated WhatsApp fee reminders</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                      Automatically message parents about pending invoices close to month-end.
                    </p>
                  </div>
                  <Switch.Root
                    className="relative h-6 w-11 rounded-full bg-muted transition data-[state=checked]:bg-primary shrink-0"
                    checked={reminders}
                    onCheckedChange={setReminders}
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
                  </Switch.Root>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Auto-generate monthly fee structures</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                      Creates new unpaid invoice records for all active students on the 1st of every month.
                    </p>
                  </div>
                  <Switch.Root
                    className="relative h-6 w-11 rounded-full bg-muted transition data-[state=checked]:bg-primary shrink-0"
                    checked={monthlyFees}
                    onCheckedChange={setMonthlyFees}
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
                  </Switch.Root>
                </div>

                <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-4">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Monthly Reminder Days
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Define the exact calendar days of the month to send automatic WhatsApp reminders. Separate multiple days with commas:
                  </p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-primary placeholder:text-muted-foreground/60 font-mono"
                      placeholder="e.g. 5, 7, 31 (31 is treated as the last day of the month)"
                      value={reminderDaysList}
                      onChange={(e) => setReminderDaysList(e.target.value)}
                    />
                    <span className="text-[10px] text-muted-foreground/80 italic">
                      Note: Set 31 to trigger on the last day of any month (e.g. Feb 28, Apr 30, May 31).
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-inner">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    WhatsApp Message Preview
                  </label>
                  <div className="rounded-lg bg-[#DCF8C6] dark:bg-[#202C33] p-3 text-xs text-gray-900 dark:text-gray-100 shadow-sm border border-black/5 dark:border-white/5 font-sans whitespace-pre-line">
                    {"Dear Parent,\n\nThis is a fee reminder from *[Your Center Name]*.\n\n• *Student Name:* John Doe\n• *Class:* Grade 10 (Evening Batch)\n• *Billing Month:* October 2026\n• *Pending Amount:* ₹2,500\n\nPlease complete payment here: https://attendly.in/parent/fees\n\nThank you!"}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => saveSettingsMutation.mutate()}
                isLoading={saveSettingsMutation.isPending}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ align, text, time }: { align: "left" | "right"; text: string; time: string }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm",
          align === "right"
            ? "rounded-br-none bg-[#DCF8C6] text-gray-900 dark:bg-primary dark:text-primary-foreground"
            : "rounded-bl-none bg-white text-gray-900 dark:bg-[#202C33] dark:text-white",
        )}
      >
        <p>{text}</p>
        {time ? <p className="mt-1 text-right text-[10px] text-muted-foreground">{time}</p> : null}
      </div>
    </div>
  );
}

function QuickChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Megaphone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted dark:bg-[#2A3942] dark:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
