"use client";

import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SettingsToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function SettingsToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5 h-7 w-12 shrink-0 rounded-full bg-muted transition data-[state=checked]:bg-primary disabled:cursor-not-allowed"
      >
        <Switch.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-5" />
      </Switch.Root>
    </div>
  );
}
