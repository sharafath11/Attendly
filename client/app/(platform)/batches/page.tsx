"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/button";

const batches = [
  {
    id: "1",
    name: "Grade 10 - Algebra",
    level: "Grade 10",
    time: "4:00 PM - 5:30 PM",
    days: "Mon, Wed, Fri",
    students: 28,
  },
  {
    id: "2",
    name: "Grade 12 - Physics",
    level: "Grade 12",
    time: "10:00 AM - 12:00 PM",
    days: "Tue, Thu, Sat",
    students: 22,
  },
  {
    id: "3",
    name: "Grade 9 - English",
    level: "Grade 9",
    time: "3:00 PM - 4:30 PM",
    days: "Mon, Thu",
    students: 18,
  },
];

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground">Manage schedules and batch cohorts.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Batch
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => (
          <div key={batch.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">{batch.name}</h3>
                <p className="text-xs text-muted-foreground">{batch.level}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {batch.students} Students
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Time:</span> {batch.time}
              </p>
              <p>
                <span className="font-medium text-foreground">Days:</span> {batch.days}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                Edit
              </button>
              <button className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                Delete
              </button>
              <button className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                View Students
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
