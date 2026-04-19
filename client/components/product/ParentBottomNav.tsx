"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, IndianRupee, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/parent", label: "Home", icon: Home, match: (p: string) => p === "/parent" },
  { href: "/parent/attendance", label: "Attendance", icon: UserCircle, match: (p: string) => p.startsWith("/parent/attendance") },
  { href: "/parent/fees", label: "Fees", icon: IndianRupee, match: (p: string) => p.startsWith("/parent/fees") },
  { href: "/parent/updates", label: "Updates", icon: Bell, match: (p: string) => p.startsWith("/parent/updates") },
];

export default function ParentBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg"
      aria-label="Parent navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors sm:text-xs",
                active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
