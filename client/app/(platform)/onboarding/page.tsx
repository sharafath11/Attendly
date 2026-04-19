"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/button";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Create your center",
    body: "Add your center name and contact so messages and receipts look professional.",
    href: "/register-center",
    cta: "Create center",
  },
  {
    title: "Add your first students",
    body: "Add at least 3 students so attendance and fees start to feel real.",
    href: "/students",
    cta: "Add students",
  },
  {
    title: "Create a batch",
    body: "Group students who meet on the same days — like “Grade 10 evening”.",
    href: "/batches",
    cta: "Create batch",
  },
  {
    title: "Mark your first attendance",
    body: "Open today’s batch and tap present or absent — it takes seconds.",
    href: "/attendance",
    cta: "Mark attendance",
  },
  {
    title: "Send your first reminder",
    body: "Ping parents on WhatsApp for fees or updates — no chasing calls.",
    href: "/messages",
    cta: "Send reminder",
  },
];

export default function OnboardingPage() {
  const [done, setDone] = useState<Record<number, boolean>>({});

  const completed = steps.filter((_, i) => done[i]).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Set up your center in 5 minutes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete setup checklist — you’ll see value on the dashboard right away.
        </p>
        <p className="mt-2 text-sm font-medium text-primary">You’re {pct}% ready</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn(
              "rounded-2xl border border-border bg-card p-4 shadow-sm",
              done[index] && "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done[index] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {done[index] ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-foreground">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={step.href}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition-colors hover:bg-secondary"
                  >
                    {step.cta}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDone((d) => ({ ...d, [index]: !d[index] }))}>
                    {done[index] ? "Undo" : "Mark done"}
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
        <p className="text-sm font-medium text-foreground">Complete setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you’re done, your dashboard will show fees, attendance, and reminders in one place.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
