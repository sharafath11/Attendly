"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parentApi } from "@/services/parent.api";
import { getRequest } from "@/services/api";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Search, Check, ChevronDown } from "lucide-react";

type CenterPick = { id: string; name: string; city: string };

export default function ParentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  // Combobox State
  const [centerId, setCenterId] = useState<string>("");
  const [centerName, setCenterName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CenterPick[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Centers
  useEffect(() => {
    const fetchCenters = async () => {
      setIsSearching(true);
      try {
        const res = await getRequest(`/centers/search?q=${searchQuery}`);
        if (res?.ok && Array.isArray(res.data)) {
          setSearchResults(res.data);
        }
      } catch (error) {
        console.error("Failed to search centers", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      if (isDropdownOpen) {
        fetchCenters();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, isDropdownOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCenterSelect = (center: CenterPick) => {
    setCenterId(center.id);
    setCenterName(center.name);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const requestOtp = async () => {
    if (!centerId) {
      showErrorToast("Please select your Tuition Center first.");
      return;
    }
    if (!phone || phone.length < 10) {
      showErrorToast("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await parentApi.requestOtp({ phone, centerId });
      setLoading(false);
      if (!res?.ok) {
        showErrorToast((res as { msg?: string })?.msg || "Could not send code");
        return;
      }
      showSuccessToast("Check WhatsApp for your login code.");
      setStep("otp");
    } catch {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await parentApi.verifyOtp({ phone, otp, centerId });
      setLoading(false);
      if (!res?.ok) {
        showErrorToast((res as { msg?: string })?.msg || "Invalid code");
        return;
      }
      showSuccessToast("Welcome back");
      window.location.href = "/parent";
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Parent Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find your child's center and we’ll send a WhatsApp OTP to verify your identity.
        </p>

        {step === "phone" ? (
          <div className="mt-6 space-y-4">
            {/* SEARCHABLE COMBOBOX */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm text-muted-foreground mb-1">Tuition Center</label>
              <div 
                className="flex items-center justify-between w-full rounded-lg border border-border bg-background px-3 py-3 text-base cursor-pointer hover:border-primary transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={centerName ? "text-foreground" : "text-muted-foreground"}>
                  {centerName || "Search by center name or city..."}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center border-b border-border px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                    <input
                      autoFocus
                      className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                      placeholder="Type name or city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((center) => (
                        <div
                          key={center.id}
                          className="flex items-center justify-between p-2 rounded-sm cursor-pointer hover:bg-muted text-sm"
                          onClick={() => handleCenterSelect(center)}
                        >
                          <div>
                            <div className="font-medium">{center.name}</div>
                            <div className="text-xs text-muted-foreground">{center.city}</div>
                          </div>
                          {centerId === center.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">No centers found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="block text-sm">
              <span className="text-muted-foreground mb-1 block">Parent WhatsApp Number</span>
              <input
                inputMode="numeric"
                autoComplete="tel"
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary transition-colors"
                placeholder="10-digit parent number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <Button type="button" className="w-full" size="lg" isLoading={loading} onClick={requestOtp}>
              Send OTP via WhatsApp
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-md bg-muted/50 p-3 mb-2 flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Sending to</span>
                <span className="font-medium">+91 {phone}</span>
              </div>
              <button type="button" className="text-primary text-xs font-medium hover:underline" onClick={() => setStep("phone")}>
                Change
              </button>
            </div>
            
            <label className="block text-sm">
              <span className="text-muted-foreground mb-1 block">Enter 6-digit OTP</span>
              <input
                inputMode="numeric"
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-xl tracking-widest text-center font-medium outline-none focus:border-primary transition-colors"
                placeholder="••••••"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </label>
            <p className="text-xs text-muted-foreground text-center">
              This code is valid for 5 minutes.
            </p>
            <Button type="button" className="w-full" size="lg" isLoading={loading} onClick={verify}>
              Verify & Login
            </Button>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Staff login?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Open center app
        </Link>
      </p>
    </div>
  );
}
