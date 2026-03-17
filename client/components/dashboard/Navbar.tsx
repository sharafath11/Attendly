"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, Search, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { userAuthMethods } from "@/services/methods/userMethods";
interface NavbarProps {
  onMenuClick: () => void;
  role: "center_owner" | "teacher" | null;
  userName?: string | null;
}

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function Navbar({ onMenuClick, role, userName }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <button
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
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
        <button
          className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
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
                <DropdownMenu.Item className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  Profile
                </DropdownMenu.Item>
                {isOwner && (
                  <DropdownMenu.Item className="cursor-pointer rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
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
