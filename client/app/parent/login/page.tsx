"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parentApi } from "@/services/parent.api";
import { Button } from "@/components/button";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type CenterPick = { id: string; name: string };

export default function ParentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [centerId, setCenterId] = useState<string | undefined>();
  const [centers, setCenters] = useState<CenterPick[] | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setLoading(true);
    try {
      const res = await parentApi.requestOtp({ phone, centerId });
      setLoading(false);
      if (!res?.ok) {
        showErrorToast((res as { msg?: string })?.msg || "Could not send code");
        return;
      }
      const payload = (res as { data?: Record<string, unknown> }).data ?? {};
      if (payload.needsCenterPick && Array.isArray(payload.centers)) {
        setCenters(payload.centers as CenterPick[]);
        showErrorToast("Pick your center below, then tap send again.");
        return;
      }
      if (typeof payload.centerId === "string") setCenterId(payload.centerId);
      if (typeof payload.devOtp === "string") {
        showSuccessToast(`Dev OTP: ${payload.devOtp}`);
      } else {
        showSuccessToast("Check WhatsApp for your login code.");
      }
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
      router.replace("/parent");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Parent login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We’ll send a one-time code to the parent number your center saved for your child.
        </p>

        {centers && centers.length > 0 ? (
          <label className="mt-4 block text-sm">
            <span className="text-muted-foreground">Select center</span>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-3 text-base"
              value={centerId ?? ""}
              onChange={(e) => setCenterId(e.target.value || undefined)}
            >
              <option value="">Choose…</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {step === "phone" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">Mobile number</span>
              <input
                inputMode="numeric"
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-3 text-base"
                placeholder="10-digit parent number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <Button type="button" className="w-full" size="lg" isLoading={loading} onClick={requestOtp}>
              Send WhatsApp code
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">6-digit code</span>
              <input
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-3 text-base tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </label>
            <Button type="button" className="w-full" size="lg" isLoading={loading} onClick={verify}>
              Verify & continue
            </Button>
            <button type="button" className="w-full text-sm text-primary" onClick={() => setStep("phone")}>
              Change number
            </button>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Staff login?{" "}
        <Link href="/login" className="font-medium text-primary">
          Open center app
        </Link>
      </p>
    </div>
  );
}
