"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminAuthService } from "@/services/adminAuth.service";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Centers", href: "/admin/centers" },
  ];
  const pageTitle = navItems.find((item) => pathname?.startsWith(item.href))?.label ?? "Admin";

  useEffect(() => {
    if (pathname === "/admin/login") return;
    let active = true;
    const loadRole = async () => {
      const res = await adminAuthService.me();
      if (!active) return;
      if (res?.ok && res.data?.role === "super_admin") {
        setAuthorized(true);
        return;
      }
      router.replace("/admin/login");
    };
    loadRole();
    return () => {
      active = false;
    };
  }, [router, pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading admin console...
      </div>
    );
  }

  const handleLogout = async () => {
    await adminAuthService.logout();
    setAuthorized(false);
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-border bg-card p-6">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Attendly Admin</p>
            <h1 className="text-lg font-semibold">Control Center</h1>
          </div>
          <nav className="space-y-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 bg-muted/10 p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
                <h2 className="text-2xl font-semibold">{pageTitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                  Super Admin
                </span>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary"
                >
                  Logout
                </button>
              </div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
