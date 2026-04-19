"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, MessageCircle, Send, Users } from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

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
  const [activeId, setActiveId] = useState(threads[0].id);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  const sendPreview = () => {
    if (!draft.trim()) {
      toast.message("Type a short message first");
      return;
    }
    toast.success("Preview sent — connect WhatsApp Business to deliver for real.");
    setDraft("");
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-stretch">
      <aside className="w-full shrink-0 rounded-2xl border border-border bg-card shadow-sm lg:max-w-xs">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">WhatsApp-style panel (preview)</p>
        </div>
        <ul className="max-h-[40vh] divide-y divide-border overflow-y-auto lg:max-h-[min(70vh,560px)]">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-muted/60",
                  activeId === t.id && "bg-primary/5",
                )}
              >
                <span className="flex items-center justify-between gap-2 font-medium text-foreground">
                  <span className="truncate">{t.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{t.time}</span>
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{t.preview}</span>
                {t.unread ? (
                  <span className="mt-1 inline-flex w-fit rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    New
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-[320px] flex-1 flex-col rounded-2xl border border-border bg-[#E5DDD5] shadow-inner dark:bg-[#0C1418]">
        <div className="flex items-center gap-2 border-b border-black/5 bg-[#075E54] px-4 py-3 text-primary-foreground dark:bg-[#1F2C33]">
          <MessageCircle className="h-5 w-5 opacity-90" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{active.title}</p>
            <p className="text-[11px] opacity-80">Preview · not sent to phones yet</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <Bubble align="left" text={active.preview} time={active.time} />
          <Bubble
            align="left"
            text="Parents can reply on WhatsApp once your center connects the official channel."
            time=""
          />
        </div>

        <div className="border-t border-black/10 bg-[#F0F0F0] p-3 dark:bg-[#1F2C33]">
          <div className="mb-2 flex flex-wrap gap-2">
            <QuickChip icon={Megaphone} label="Broadcast" onClick={() => toast.message("Opens broadcast composer")} />
            <QuickChip icon={Users} label="Fee reminder" onClick={() => toast.message("Template: fee reminder")} />
          </div>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="min-h-[44px] flex-1 rounded-full border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-[#2A3942] dark:text-white"
            />
            <Button
              type="button"
              size="lg"
              className="h-11 w-11 shrink-0 rounded-full p-0"
              aria-label="Send"
              onClick={sendPreview}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Bubble({ align, text, time }: { align: "left" | "right"; text: string; time: string }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm",
          align === "right" ? "rounded-br-none bg-[#DCF8C6] text-gray-900 dark:bg-primary dark:text-primary-foreground" : "rounded-bl-none bg-white text-gray-900 dark:bg-[#202C33] dark:text-white",
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
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted dark:bg-[#2A3942]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
