"use client";

import * as Switch from "@radix-ui/react-switch";
import FormInput from "@/components/dashboard/FormInput";
import { Button } from "@/components/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Profile Info</h2>
          <div className="mt-4 grid gap-4">
            <FormInput label="Full Name" placeholder="Attendly" />
            <FormInput label="Email" placeholder="teacher@attendly.com" type="email" />
            <FormInput label="Phone" placeholder="+91" />
          </div>
          <div className="mt-4">
            <Button>Update Profile</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          <div className="mt-4 grid gap-4">
            <FormInput label="Current Password" type="password" placeholder="••••••••" />
            <FormInput label="New Password" type="password" placeholder="••••••••" />
          </div>
          <div className="mt-4">
            <Button>Save Password</Button>
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
