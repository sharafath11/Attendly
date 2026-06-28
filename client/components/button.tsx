import type React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "btn-tactile inline-flex items-center justify-center font-medium rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"

  const variants = {
    primary: cn(
      "bg-primary text-primary-foreground",
      "hover:bg-[var(--btn-primary-hover)] hover:shadow-[0_0_16px_var(--glow-primary)]",
      "dark:hover:shadow-[0_0_20px_var(--glow-primary)]",
    ),
    secondary: cn(
      "border border-border bg-card text-card-foreground",
      "hover:bg-[var(--btn-secondary-hover)] hover:border-[var(--card-hover-border)]",
    ),
    ghost: cn(
      "text-foreground",
      "hover:bg-secondary",
    ),
    danger: cn(
      "border border-destructive/30 bg-destructive/5 text-destructive",
      "hover:bg-destructive/10 hover:border-destructive/50",
    ),
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    icon: "h-9 w-9 p-0",
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
