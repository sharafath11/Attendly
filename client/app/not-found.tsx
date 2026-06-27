"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0f1a] text-slate-100">
      {/* Dynamic Background Glows */}
      <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Attendly branding touch */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <span className="bg-gradient-to-br from-emerald-400 to-sky-400 bg-clip-text text-5xl font-black text-transparent">
            404
          </span>
        </div>
        
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Lost in the clouds?
        </h1>
        
        <p className="mb-10 max-w-md text-base text-slate-400 sm:text-lg">
          The page you are looking for doesn't exist, has been moved, or you don't have access to it.
        </p>

        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link href="/">
            <Button variant="primary" size="lg" className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            size="lg" 
            className="w-full gap-2 sm:w-auto" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
