import type React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, className, ...props }: FormInputProps) {
  return (
    <label className="block space-y-1.5 text-sm text-muted-foreground">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        className={cn(
          "input-interactive w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground shadow-sm",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
          "transition-colors duration-200",
          error && "border-destructive focus-visible:ring-destructive/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
