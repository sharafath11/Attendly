"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as Switch from "@radix-ui/react-switch";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";
import { userAuthMethods } from "@/services/methods/userMethods";
import { centersService } from "@/services/centers.service";
import { Shield, User, Loader2, X, Plus } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userResponse, isLoading: isUserLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await userAuthMethods.me();
      return res?.ok ? res.data : null;
    },
  });

  const { data: centerResponse, isLoading: isCenterLoading } = useQuery({
    queryKey: ["currentCenter"],
    queryFn: async () => {
      const res = await centersService.getMyCenter();
      return res?.ok ? res.data : null;
    },
  });

  const [formData, setFormData] = useState({
    centerName: "",
    name: "",
    email: "",
    phone: "",
    mediums: ["English", "Malayalam"],
    sessions: ["Morning", "Evening"],
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (userResponse) {
      // Access restriction: only center_owner and super_admin allowed
      // Access restriction: only center_owner, teacher, and super_admin allowed
      if (userResponse.role !== "center_owner" && userResponse.role !== "teacher" && userResponse.role !== "super_admin") {
        router.replace("/dashboard");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        name: userResponse.name || "",
        email: userResponse.email || "",
        phone: userResponse.phone || "",
      }));
    }
  }, [userResponse, router]);

  useEffect(() => {
    if (centerResponse) {
      setFormData((prev) => ({
        ...prev,
        centerName: centerResponse.name || "",
        mediums: centerResponse.mediums?.length > 0 ? centerResponse.mediums : ["English", "Malayalam"],
        sessions: centerResponse.sessions?.length > 0 ? centerResponse.sessions : ["Morning", "Evening"],
      }));
    }
  }, [centerResponse]);

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      showErrorToast("Full Name cannot be empty");
      return;
    }
    if (!formData.centerName.trim()) {
      showErrorToast("Center Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);

    try {
      const res = await userAuthMethods.updateProfile({
        name: formData.name,
        phone: formData.phone,
        centerName: formData.centerName,
        mediums: formData.mediums,
        sessions: formData.sessions,
      });

      if (res && res.ok) {
        showSuccessToast("Profile updated successfully");
        // Invalidate queries to refresh navbar / sidebar names in real-time
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        await queryClient.invalidateQueries({ queryKey: ["currentCenter"] });
      } else {
        showErrorToast(res?.msg || "Failed to update profile.");
      }
    } catch (error: any) {
      showErrorToast(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      showErrorToast("Please fill in both password fields");
      return;
    }

    if (passwords.newPassword.length < 6) {
      showErrorToast("New password must be at least 6 characters long");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await userAuthMethods.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      if (res && res.ok) {
        showSuccessToast("Password updated successfully");
        setPasswords({ currentPassword: "", newPassword: "" });
      } else {
        showErrorToast(res?.msg || "Failed to update password.");
      }
    } catch (error: any) {
      showErrorToast(error?.message || "Failed to update password. Please try again.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAddItem = (field: "mediums" | "sessions") => {
    const item = window.prompt(`Enter new ${field === "mediums" ? "Medium" : "Session"} name:`);
    if (item && item.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], item.trim()],
      }));
    }
  };

  const handleRemoveItem = (field: "mediums" | "sessions", idx: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "center_owner":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Shield className="h-3.5 w-3.5" />
            Owner
          </span>
        );
      case "teacher":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <User className="h-3.5 w-3.5" />
            Teacher
          </span>
        );
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Shield className="h-3.5 w-3.5" />
            Super Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {role || "User"}
          </span>
        );
    }
  };

  const isLoading = isUserLoading || isCenterLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double safety guard check
  if (userResponse && userResponse.role !== "center_owner" && userResponse.role !== "teacher" && userResponse.role !== "super_admin") {
    return null;
  }

  const isOwner = userResponse?.role === "center_owner" || userResponse?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Profile Info</h2>
              {userResponse?.role && getRoleBadge(userResponse.role)}
            </div>
            
            <div className="grid gap-4">
              {isOwner && (
                <FormInput
                  label="Center Name"
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                />
              )}
              <FormInput
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <FormInput
                label="Email"
                value={formData.email}
                type="email"
                readOnly
                className="bg-muted/50 cursor-not-allowed"
              />
              <FormInput
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            {isOwner && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Custom Data Options</h3>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">Mediums</label>
                      <button type="button" onClick={() => handleAddItem("mediums")} className="text-xs flex items-center gap-1 text-primary hover:underline">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 min-h-[60px] rounded-lg border border-border bg-input">
                      {formData.mediums.map((m, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground font-medium">
                          {m}
                          <button type="button" onClick={() => handleRemoveItem("mediums", idx)} className="hover:text-destructive text-muted-foreground"><X className="h-3 w-3"/></button>
                        </span>
                      ))}
                      {formData.mediums.length === 0 && <span className="text-xs text-muted-foreground">No mediums added</span>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-muted-foreground">Sessions</label>
                      <button type="button" onClick={() => handleAddItem("sessions")} className="text-xs flex items-center gap-1 text-primary hover:underline">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 min-h-[60px] rounded-lg border border-border bg-input">
                      {formData.sessions.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground font-medium">
                          {s}
                          <button type="button" onClick={() => handleRemoveItem("sessions", idx)} className="hover:text-destructive text-muted-foreground"><X className="h-3 w-3"/></button>
                        </span>
                      ))}
                      {formData.sessions.length === 0 && <span className="text-xs text-muted-foreground">No sessions added</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Email cannot be changed.</span>
            <Button
              isLoading={isSavingProfile}
              onClick={handleSaveProfile}
              disabled={!formData.name || (isOwner && !formData.centerName)}
            >
              Save Profile
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          <div className="mt-4 grid gap-4">
            <FormInput
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
            <FormInput
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Button
              isLoading={isSavingPassword}
              onClick={handleSavePassword}
              disabled={!passwords.currentPassword || !passwords.newPassword}
            >
              Save Password
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
        <div className="mt-4 space-y-4">
          {[
            { id: "attendance", label: "Attendance notifications" },
            { id: "fees", label: "Fee reminders" },
            { id: "reports", label: "Monthly reports" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.label}</span>
              <Switch.Root
                className="relative h-6 w-11 rounded-full bg-muted transition data-[state=checked]:bg-primary"
                defaultChecked
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
              </Switch.Root>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
