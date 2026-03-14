"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { adminAuthService } from "@/services/adminAuth.service";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlertMessage("");

    const res = await adminAuthService.login({
      username: formData.username,
      password: formData.password,
    });

    setIsLoading(false);

    if (!res || !res.ok) {
      const errorMsg = res?.msg || "Admin login failed";
      setAlertMessage(errorMsg);
      showErrorToast(errorMsg);
      return;
    }

    showSuccessToast(res.msg || "Admin login successful");
    router.push("/admin/dashboard");
  };

  return (
    <AuthCard title="Admin Sign In" description="Access the Attendly control center">
      <form onSubmit={handleSubmit} className="space-y-4">
        {alertMessage && <Alert type="error" message={alertMessage} onClose={() => setAlertMessage("")} />}

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="admin"
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
        />

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
