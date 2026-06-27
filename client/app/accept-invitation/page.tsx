"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/button";
import { PasswordInput } from "@/components/password-input";
import { Alert } from "@/components/alert";
import { getRequest, postRequest } from "@/services/api";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setErrorMsg("Invitation token is missing. Please check the link sent to your email.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await getRequest<{ ok: boolean; data?: { name: string; email: string }; msg?: string }>(
          `/auth/validate-invite-token?token=${token}`
        );
        if (res && res.ok && res.data) {
          setTeacherName(res.data.name);
          setTeacherEmail(res.data.email);
        } else {
          setErrorMsg(res?.msg || "Invitation link is invalid or has expired.");
        }
      } catch (err) {
        setErrorMsg("Failed to validate invitation token.");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const errors: Record<string, string> = {};
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await postRequest<{ ok: boolean; msg?: string }>(
        "/auth/complete-invite-signup",
        { token, password }
      );

      if (res && res.ok) {
        showSuccessToast(res.msg || "Onboarding completed successfully!");
        router.push("/dashboard");
      } else {
        showErrorToast(res?.msg || "Failed to complete onboarding.");
      }
    } catch (err) {
      showErrorToast("An error occurred during onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthCard title="Validating Invitation" description="Please wait while we verify your secure link...">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AuthCard>
    );
  }

  if (errorMsg) {
    return (
      <AuthCard title="Invitation Invalid" description="The secure link is no longer active.">
        <Alert type="error" message={errorMsg} />
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Please ask the tuition owner to generate a new invitation email for you.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Setup Your Account" description={`Welcome, ${teacherName}. Setup your password to join.`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p><strong>Name:</strong> {teacherName}</p>
          <p className="mt-1"><strong>Email:</strong> {teacherEmail}</p>
        </div>

        <PasswordInput
          label="Choose Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={validationErrors.password}
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          error={validationErrors.confirmPassword}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={submitting}
        >
          Complete Onboarding
        </Button>
      </form>
    </AuthCard>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground">Loading invitation details...</p>
        </div>
      </div>
    }>
      <AcceptInvitationForm />
    </Suspense>
  );
}
