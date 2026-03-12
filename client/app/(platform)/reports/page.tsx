"use client";

import DataTable from "@/components/dashboard/DataTable";

const reports = [
  {
    id: "1",
    student: "Aarav Kumar",
    attendance: "94%",
    score: "88%",
    topics: "Quadratic Equations",
    date: "Mar 10, 2026",
  },
  {
    id: "2",
    student: "Maya Singh",
    attendance: "88%",
    score: "81%",
    topics: "Grammar",
    date: "Mar 08, 2026",
  },
  {
    id: "3",
    student: "Rohan Patel",
    attendance: "92%",
    score: "90%",
    topics: "Integration",
    date: "Mar 06, 2026",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and share progress reports.</p>
      </div>

      <DataTable
        columns={[
          { key: "student", header: "Student" },
          { key: "attendance", header: "Attendance %" },
          { key: "score", header: "Average Score" },
          { key: "topics", header: "Weak Topics" },
          { key: "date", header: "Generated Date" },
          {
            key: "actions",
            header: "Actions",
            render: () => (
              <div className="flex gap-2">
                <button className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  View
                </button>
                <button className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  Download
                </button>
                <button className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  Send to Parent
                </button>
              </div>
            ),
          },
        ]}
        data={reports}
      />
    </div>
  );
}
