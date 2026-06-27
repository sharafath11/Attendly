"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";

export default function NetworkProvider() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only run on the client side
    if (typeof window === "undefined") return;

    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0b0f1a] text-slate-100">
      {/* Dynamic Background Glows */}
      <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Disconnected Icon */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <WifiOff className="h-12 w-12 text-rose-400" />
        </div>
        
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          No Internet Connection
        </h1>
        
        <p className="mb-10 max-w-md text-base text-slate-400 sm:text-lg">
          It looks like you're offline. Please check your network connection. Attendly will automatically refresh when you're back online.
        </p>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full gap-2 sm:w-auto" 
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
