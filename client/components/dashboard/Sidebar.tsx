"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userAuthMethods } from "@/services/methods/userMethods";
import gsap from "gsap";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  WalletCards,
  Settings,
  LogOut,
  Layers,
  HandCoins,
  MessageCircle,
  Zap,
  CreditCard,
  Rocket,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  role: "center_owner" | "teacher" | null;
  centerName?: string | null;
}

interface NavSubItem {
  label: string;
  href: string;
}

interface NavGroupItem {
  label: string;
  icon: any;
  subItems: NavSubItem[];
}

interface SingleNavItem {
  label: string;
  href: string;
  icon: any;
}

type NavItem = SingleNavItem | NavGroupItem;

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, role, centerName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await userAuthMethods.logout();
    router.replace("/login");
  };
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const width = isDesktop ? (collapsed ? 86 : 260) : 280;

  useEffect(() => {
    setMounted(true);
  }, []);

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
      gsap.to(sidebarRef.current, { x: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 });
    } else {
      if (mobileOpen) {
        gsap.to(sidebarRef.current, { x: 0, duration: 0.3, ease: "power2.out" });
        gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.2 });
      } else {
        gsap.to(sidebarRef.current, { x: -320, duration: 0.25, ease: "power2.out" });
        gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 });
      }
    }
  }, [mobileOpen, isDesktop]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (!isDesktop) {
      onMobileClose();
    }
  }, [pathname, isDesktop, onMobileClose]);

  const navigationStructure = useMemo((): NavItem[] => {
    const isOwner = role === "center_owner";

    const commonTop: NavItem[] = [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ];

    if (isOwner) {
      commonTop.push(
        { label: "Messages", href: "/messages", icon: MessageCircle },
        { label: "Automation", href: "/automation", icon: Zap }
      );
    }

    // Owner sees everything including fees and parents
    const ownerUsersGroup: NavItem = {
      label: "Users Management",
      icon: Users,
      subItems: [
        { label: "Student Directory", href: "/students" },
        { label: "Parents Directory", href: "/parents" },
        { label: "Batch Management", href: "/batches" },
        { label: "Attendance Logs", href: "/attendance" },
        { label: "Schedule Exam", href: "/exams/create" },
        { label: "Fee Records", href: "/fees" },
      ],
    };

    // Teacher sees students/batches/attendance but NOT fees
    const teacherUsersGroup: NavItem = {
      label: "Academic",
      icon: Users,
      subItems: [
        { label: "Student Directory", href: "/students" },
        { label: "Batch Management", href: "/batches" },
        { label: "Attendance Logs", href: "/attendance" },
      ],
    };

    const teachersGroup: NavItem = {
      label: "Teachers Management",
      icon: ShieldCheck,
      subItems: [
        { label: "Teacher Accounts", href: "/teachers" },
        { label: "Mark Attendance", href: "/teacher-attendance" },
        { label: "Attendance History", href: "/teacher-attendance-history" },
        { label: "Payroll & Payments", href: "/teacher-payments" },
      ],
    };

    // Teachers see their own salary page only
    const teacherSelfGroup: NavItem = {
      label: "My Information",
      icon: ShieldCheck,
      subItems: [
        { label: "My Salary Slips", href: "/teacher-payments" },
        { label: "My Attendance", href: "/teacher-attendance-history" },
      ],
    };


    const systemBottom: NavItem[] = [];
    if (isOwner) {
      systemBottom.push(
        { label: "Subscription", href: "/subscription-status", icon: CreditCard },
        { label: "Setup Guide", href: "/onboarding", icon: Rocket },
        { label: "Settings", href: "/settings", icon: Settings }
      );
    }

    if (isOwner) {
      return [...commonTop, ownerUsersGroup, teachersGroup, ...systemBottom];
    } else {
      // Teacher: academic group + their own info
      return [...commonTop, teacherUsersGroup, teacherSelfGroup];
    }
  }, [role]);

  // Auto-expand group based on active pathname
  useEffect(() => {
    if (collapsed) return;
    for (const item of navigationStructure) {
      if ("subItems" in item) {
        const matches = item.subItems.some(
          (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
        );
        if (matches) {
          setOpenGroup(item.label);
          break;
        }
      }
    }
  }, [pathname, collapsed, navigationStructure]);

  const handleGroupToggle = (label: string) => {
    if (collapsed) return;
    setOpenGroup(openGroup === label ? null : label);
  };

  return (
    <>
      <button
        ref={overlayRef}
        onClick={onMobileClose}
        aria-label="Close sidebar"
        className="fixed inset-0 z-40 bg-black/40 opacity-0 pointer-events-auto lg:hidden"
        style={{ visibility: (!isDesktop && mobileOpen) ? "visible" : "hidden" }}
      />
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen -translate-x-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-transform lg:translate-x-0",
          "flex flex-col",
          !mounted && "w-[280px] lg:w-[260px]"
        )}
        style={mounted ? { width } : undefined}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
              <Image
                src="/images/logo-light-v2.png"
                alt="Attendly logo"
                width={30}
                height={30}
                className="block dark:hidden"
              />
              <Image
                src="/images/logo-dark-v2.png"
                alt="Attendly logo"
                width={30}
                height={30}
                className="hidden dark:block"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate max-w-[150px]" title={centerName || "Attendly"}>
                  {centerName || "Attendly"}
                </p>
                <p className="text-xs text-muted-foreground">v 0.21.1</p>
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

        <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          {navigationStructure.map((item) => {
            const Icon = item.icon;

            if ("subItems" in item) {
              const isGroupOpen = openGroup === item.label;
              const hasActiveSub = item.subItems.some(
                (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)
              );

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => handleGroupToggle(item.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      hasActiveSub
                        ? "bg-sidebar-accent/50 text-sidebar-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      isGroupOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                    )}
                  </button>

                  {isGroupOpen && !collapsed && (
                    <div className="ml-7 space-y-1 border-l border-sidebar-border pl-3">
                      {item.subItems.map((sub) => {
                        const active = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={cn(
                              "block rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

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
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
