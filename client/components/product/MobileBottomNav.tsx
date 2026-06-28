"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Home, MessageCircle, Settings, Users, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "center_owner" | "teacher" | null;

type NavItem = { href: string; label: string; icon: typeof Home };

const ownerItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/fees", label: "Fees", icon: WalletCards },
  { href: "/settings", label: "More", icon: Settings },
];

const teacherItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck2 },
  { href: "/students", label: "Students", icon: Users },
  { href: "/settings", label: "More", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "center_owner" ? ownerItems : teacherItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "btn-tactile flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium sm:text-xs",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} strokeWidth={active ? 2.25 : 1.75} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
