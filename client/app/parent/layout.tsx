import type { ReactNode } from "react";
import ParentBottomNav from "@/components/product/ParentBottomNav";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-4 backdrop-blur">
        <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Parent preview
        </p>
        <h1 className="text-lg font-semibold text-foreground">Attendly for families</h1>
        <p className="text-xs text-muted-foreground">
          Sample data — connects to your center when your teacher invites you.
        </p>
      </header>
      <main className="mx-auto max-w-lg px-4 pt-4">{children}</main>
      <ParentBottomNav />
    </div>
  );
}
