"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  WalletCards,
  Settings,
  LogOut,
  BookOpenCheck,
  Layers,
  HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  role: "center_owner" | "teacher" | null;
}

const ownerNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Batches", href: "/batches", icon: Layers },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
  { label: "Teacher Attendance", href: "/teacher-attendance", icon: CalendarCheck2 },
  { label: "Teacher Attendance History", href: "/teacher-attendance-history", icon: CalendarCheck2 },
  { label: "Fees", href: "/fees", icon: WalletCards },
  { label: "Teacher Payments", href: "/teacher-payments", icon: HandCoins },
  { label: "Teachers", href: "/teachers", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

const teacherNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Batches", href: "/batches", icon: Layers },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, role }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const width = isDesktop ? (collapsed ? 86 : 260) : 280;

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.to(sidebarRef.current, {
      width,
      duration: 0.25,
      ease: "power2.out",
    });
  }, [width]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!sidebarRef.current) return;
    if (isDesktop) {
      gsap.set(sidebarRef.current, { x: 0 });
      gsap.set(overlayRef.current, { autoAlpha: 0 });
      return;
    }
    if (mobileOpen) {
      gsap.to(sidebarRef.current, { x: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.2 });
    } else {
      gsap.to(sidebarRef.current, { x: -320, duration: 0.25, ease: "power2.out" });
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 });
    }
  }, [mobileOpen, isDesktop]);

  const items = useMemo(() => {
    const effectiveRole = role ?? "teacher";
    return effectiveRole === "center_owner" ? ownerNavItems : teacherNavItems;
  }, [role]);

  return (
    <>
      <button
        ref={overlayRef}
        onClick={onMobileClose}
        aria-label="Close sidebar"
        className="fixed inset-0 z-40 bg-black/40 opacity-0 pointer-events-auto lg:hidden"
        style={{ visibility: mobileOpen ? "visible" : "hidden" }}
      />
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen -translate-x-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-transform lg:static lg:translate-x-0",
          "flex flex-col",
        )}
        style={{ width }}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold">Attendly</p>
                <p className="text-xs text-muted-foreground">Tuition Suite</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="hidden rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            <span className="text-lg">⇔</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          {!collapsed && (
            <div className="mb-3 text-xs text-muted-foreground">
              Developer: <span className="text-foreground">Sharafath Abi</span>
            </div>
          )}
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
