"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, Shield, WalletCards } from "lucide-react";
import { AuthCard } from "@/components/auth-card";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { centersService } from "@/services/centers.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function RegisterCenterPage() {
  const [formData, setFormData] = useState({
    centerName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    medium: "English",
    planType: "basic",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertMessage("");

    const res = await centersService.registerCenter({
      ...formData,
      medium: formData.medium as "English" | "Malayalam",
      planType: formData.planType as "basic" | "pro",
    });

    setIsLoading(false);

    if (!res || !res.ok) {
      const errorMsg = res?.msg || "Registration failed";
      setAlertMessage(errorMsg);
      showErrorToast(errorMsg);
      return;
    }

    showSuccessToast(res.msg || "Registration successful. Waiting for admin approval.");
    setAlertMessage("Registration successful. Waiting for admin approval.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-slate-100">
      <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-6">
        <section className="space-y-6 lg:w-[42%]">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-sm">
              <Image src="/images/logo-dark-v2.png" alt="Attendly logo" width={30} height={30} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Attendly</p>
              <p className="text-xs text-slate-400">Tuition Center Platform</p>
            </div>
          </Link>

          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Start in minutes
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Register your center and launch a smarter tuition workflow.
            </h1>
            <p className="text-base text-slate-300">
              One dashboard to manage students, attendance, fees, and teacher payments without the daily chaos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                <CalendarCheck2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">Attendance clarity</p>
              <p className="text-xs text-slate-400">Daily rollups and trends in one view.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                <WalletCards className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">Fee tracking</p>
              <p className="text-xs text-slate-400">Instant dues and collection status.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm sm:col-span-2">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">Secure onboarding</p>
              <p className="text-xs text-slate-400">Admin verification ensures safe access.</p>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-[58%]">
          <AuthCard title="Register Center" description="Create your tuition center account">
            <form onSubmit={handleSubmit} className="space-y-4">
              {alertMessage && <Alert type="info" message={alertMessage} onClose={() => setAlertMessage("")} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Center Name" name="centerName" value={formData.centerName} onChange={handleChange} />
                <Input label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <PasswordInput label="Password" name="password" value={formData.password} onChange={handleChange} />
              <Input label="Address" name="address" value={formData.address} onChange={handleChange} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Medium</label>
                  <select
                    name="medium"
                    value={formData.medium}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Malayalam">Malayalam</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Plan Type</label>
                  <select
                    name="planType"
                    value={formData.planType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <option value="basic">Basic – ₹199/month – 5 teachers – 150 students</option>
                    <option value="pro">Pro – ₹299/month – 10 teachers – 400 students</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Submit Registration
              </Button>
            </form>
          </AuthCard>
        </section>
      </div>
    </div>
  );
}
