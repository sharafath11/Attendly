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
  isLoading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  className,
  isLoading,
  selectable,
  onSelectionChange,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? data.map((d) => d.id) : []);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(
        checked
          ? [...data.filter((d) => d.id !== id).map((d) => d.id), id]
          : data.filter((d) => d.id !== id).map((d) => d.id).filter(() => false)
      );
    }
  };

  if (isLoading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        <div className="p-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {/* Mobile Card Layout */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-3 p-4">
            {data.map((row) => (
              <div
                key={row.id}
                className="interactive-card rounded-lg border border-border bg-background p-4"
              >
                {mobileColumns.map((col) => (
                  <div key={String(col.key)} className="flex items-start justify-between gap-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{col.header}</span>
                    <span className="text-sm text-foreground text-right">
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key as string]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden scroll-guard md:block">
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
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="table-row-interactive border-t border-border">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-sm text-foreground">
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
