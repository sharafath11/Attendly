import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  className,
}: DataTableProps<T>) {
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No records found.</div>
        ) : (
          <div className="space-y-3 p-4">
            {data.map((row) => (
              <div key={row.id} className="rounded-lg border border-border bg-background p-3">
                {mobileColumns.map((col) => (
                  <div key={String(col.key)} className="flex items-start justify-between gap-3 py-1">
                    <span className="text-xs text-muted-foreground">{col.header}</span>
                    <span className="text-sm text-foreground">
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key as string]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={cn("px-4 py-3 font-medium", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm text-foreground">
                    {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key as string]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
