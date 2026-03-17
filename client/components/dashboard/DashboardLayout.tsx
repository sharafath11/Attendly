"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import PageTransition from "@/components/dashboard/PageTransition";
import { centersService } from "@/services/centers.service";
import { SubscriptionProvider } from "@/components/dashboard/SubscriptionContext";
import { userAuthMethods } from "@/services/methods/userMethods";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [role, setRole] = useState<"center_owner" | "teacher" | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      const res = await centersService.getMyCenter();
      if (!active) return;
      setSubscriptionLoading(false);
      if (!res?.ok) return;
      setSubscriptionStatus(res.data?.subscriptionStatus ?? null);
      setSubscriptionStartDate(res.data?.subscriptionStartDate ?? null);
      setSubscriptionEndDate(res.data?.subscriptionEndDate ?? null);
      setPlanType(res.data?.planType ?? null);
      setBlocked(Boolean(res.data?.blocked));
      setBlockedReason(res.data?.blockedReason ?? null);

      if (res.data?.subscriptionStatus === "blocked" || res.data?.blocked) {
        router.replace("/blocked");
      }
    };
    loadStatus();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    const loadRole = async () => {
      const res = await userAuthMethods.me();
      if (!active) return;
      if (res?.ok && res.data?.role) {
        setRole(res.data.role);
        setUserName(res.data?.name ?? null);
        return;
      }
      setRole("teacher");
    };
    loadRole();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const warningDays = useMemo(() => {
    if (!subscriptionEndDate) return null;
    const end = new Date(subscriptionEndDate);
    if (Number.isNaN(end.getTime())) return null;
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [subscriptionEndDate]);

  const showExpiryWarning =
    subscriptionStatus === "active" && warningDays !== null && warningDays >= 0 && warningDays <= 5;

  const sidebarWidth = isDesktop ? (collapsed ? 86 : 260) : 280;

  return (
    <SubscriptionProvider
      value={{
        subscriptionStatus,
        subscriptionStartDate,
        subscriptionEndDate,
        planType,
        blocked,
        blockedReason,
        loading: subscriptionLoading,
      }}
    >
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
            role={role}
          />
          <div
            className="flex min-h-screen flex-1 flex-col transition-[margin] duration-300"
            style={{ marginLeft: sidebarOpen ? sidebarWidth : 0 }}
          >
            <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} role={role} userName={userName} />
            {subscriptionStatus === "pending_payment" && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Your subscription payment is pending. System features are temporarily disabled.
              </div>
            )}
            {showExpiryWarning && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Your subscription will expire in {warningDays} days. Please renew to avoid service interruption.
              </div>
            )}
            <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1440px]">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
