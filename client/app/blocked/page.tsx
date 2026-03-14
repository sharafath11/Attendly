"use client";

import { useEffect, useState } from "react";

export default function BlockedPage() {
  const [reason, setReason] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("blockedReason");
    setReason(stored || "Subscription payment pending.");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold text-foreground">Account Blocked</h1>
        <p className="text-base text-muted-foreground">
          Your tuition center account has been temporarily blocked.
        </p>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground">
          <p className="font-medium">Reason:</p>
          <p className="text-muted-foreground">{reason}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please contact the platform administrator to restore access.
        </p>
      </div>
    </div>
  );
}
