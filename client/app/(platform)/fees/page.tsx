"use client";

import DashboardCard from "@/components/dashboard/DashboardCard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { WalletCards, AlertTriangle } from "lucide-react";

const fees = [
  { id: "1", student: "Aarav Kumar", month: "March", amount: "₹2,400", status: "Paid" },
  { id: "2", student: "Maya Singh", month: "March", amount: "₹2,000", status: "Pending" },
  { id: "3", student: "Rohan Patel", month: "March", amount: "₹3,200", status: "Overdue" },
  { id: "4", student: "Zara Khan", month: "March", amount: "₹2,800", status: "Paid" },
];

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fees</h1>
        <p className="text-sm text-muted-foreground">Track monthly tuition payments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          title="Total Collected"
          value={186000}
          prefix="₹"
          icon={<WalletCards className="h-5 w-5" />}
          trend="+8% vs last month"
        />
        <DashboardCard
          title="Pending Fees"
          value={42000}
          prefix="₹"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend="18 students pending"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <option>March</option>
          <option>February</option>
          <option>January</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <option>All Batches</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: "student", header: "Student" },
          { key: "month", header: "Month" },
          { key: "amount", header: "Amount" },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={row.status as "Paid" | "Pending" | "Overdue"} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: () => (
              <button className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                View
              </button>
            ),
          },
        ]}
        data={fees}
      />
    </div>
  );
}
