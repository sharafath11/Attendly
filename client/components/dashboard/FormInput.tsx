import type React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, className, ...props }: FormInputProps) {
  return (
    <label className="block space-y-1 text-sm text-muted-foreground">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        className={cn(
          "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
