"use client";

import type { ReactNode } from "react";
import { ParentProvider, useParentContext } from "@/context/ParentContext";
import ParentBottomNav from "@/components/product/ParentBottomNav";
import { Users, GraduationCap } from "lucide-react";

function ParentHeader() {
  const { childrenList, selectedChildId, setSelectedChildId, isLoading } = useParentContext();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-4 backdrop-blur shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Family Portal
          </p>
          <h1 className="text-lg font-semibold text-foreground">Attendly</h1>
        </div>
        
        {!isLoading && childrenList.length > 1 && (
          <div className="flex-shrink-0 relative max-w-[200px]">
            <label className="sr-only">Switch Student Profile</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              </div>
              <select
                value={selectedChildId || ""}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="block w-full pl-8 pr-8 py-2 text-sm border-border bg-card rounded-lg appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-foreground shadow-sm truncate"
              >
                {childrenList.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <ParentProvider>
      <div className="min-h-screen bg-background pb-24 font-sans">
        <ParentHeader />
        <main className="mx-auto max-w-lg px-4 pt-6">{children}</main>
        <ParentBottomNav />
      </div>
    </ParentProvider>
  );
}
