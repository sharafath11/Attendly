"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Bell, Search, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { userAuthMethods } from "@/services/methods/userMethods";
import { useSocket } from "@/hooks/useSocket";
import { getRequest, postRequest } from "@/services/api";
import { showInfoToast } from "@/utils/toast";
import { useCallback } from "react";

interface NavbarProps {
  onMenuClick: () => void;
  role: "center_owner" | "teacher" | null;
  userName?: string | null;
  centerName?: string | null;
}

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function Navbar({ onMenuClick, role, userName, centerName }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const fetchUnread = async () => {
      try {
        const res = await getRequest<{ ok: boolean; data?: any[] }>("/notifications/unread");
        if (res && res.ok && Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications", err);
      }
    };
    fetchUnread();
  }, []);

  const handleNotificationReceived = useCallback((newNotification: any) => {
    showInfoToast(`${newNotification.title}: ${newNotification.message}`);
    setNotifications((prev) => {
      if (prev.some((n) => n._id === newNotification._id)) return prev;
      return [newNotification, ...prev];
    });
  }, []);

  useSocket(handleNotificationReceived);

  const handleMarkAllRead = async () => {
    try {
      const res = await postRequest<{ ok: boolean }>("/notifications/mark-read", {});
      if (res && res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const isOwner = role === "center_owner";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await userAuthMethods.logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="relative hidden w-72 items-center md:flex">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Search"
            placeholder="Search students, batches..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="relative rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-80 rounded-lg border border-border bg-card p-3 text-sm shadow-lg max-h-96 overflow-y-auto"
              sideOffset={8}
              align="end"
            >
              <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                <span className="font-semibold text-foreground">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-primary hover:underline focus:outline-none"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {notifications.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <DropdownMenu.Item
                      key={item._id}
                      className="flex flex-col gap-1 rounded-md p-2 hover:bg-secondary cursor-pointer focus:bg-secondary outline-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                    </DropdownMenu.Item>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <button
          className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {mounted ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(userName)}
                </span>
                <span className="hidden text-xs font-medium text-foreground sm:inline">
                  {userName ?? "User"}
                </span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={cn(
                  "z-50 min-w-[180px] rounded-lg border border-border bg-card p-2 text-sm shadow-lg",
                )}
                sideOffset={8}
              >
                <DropdownMenu.Item
                  onSelect={() => router.push("/settings")}
                  className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Profile
                </DropdownMenu.Item>
                {isOwner && (
                  <DropdownMenu.Item
                    onSelect={() => router.push("/settings")}
                    className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Settings
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Separator className="my-2 h-px bg-border" />
                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(userName)}
            </span>
            <span className="hidden text-xs font-medium text-foreground sm:inline">
              {userName ?? "User"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
