"use client";

import { useState } from "react";
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
    <AuthCard title="Register Center" description="Create your tuition center account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {alertMessage && <Alert type="info" message={alertMessage} onClose={() => setAlertMessage("")} />}

        <Input label="Center Name" name="centerName" value={formData.centerName} onChange={handleChange} />
        <Input label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
        <PasswordInput label="Password" name="password" value={formData.password} onChange={handleChange} />
        <Input label="Address" name="address" value={formData.address} onChange={handleChange} />

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

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Submit Registration
        </Button>
      </form>
    </AuthCard>
  );
}
