import Link from "next/link";
import { ArrowRight, CheckCircle2, Users, GraduationCap, CalendarCheck, Wallet, TrendingUp, Shield, Globe2 } from "lucide-react";
import { Button } from "@/components/button";

const featureItems = [
  {
    title: "Teacher Management",
    description: "Create teacher accounts, assign subjects, and manage access in one place.",
    icon: Users,
  },
  {
    title: "Student Management",
    description: "Register students with fee details, contact info, and batch mappings.",
    icon: GraduationCap,
  },
  {
    title: "Batch & Subject Organization",
    description: "Organize classes by batch, level, medium, and subjects effortlessly.",
    icon: CalendarCheck,
  },
  {
    title: "Attendance Tracking",
    description: "Mark daily attendance and quickly review absentees for each batch.",
    icon: CheckCircle2,
  },
  {
    title: "Fee Management",
    description: "Track monthly fee status, pending payments, and payment history.",
    icon: Wallet,
  },
  {
    title: "Teacher Salary Management",
    description: "Record and review monthly teacher payments to avoid disputes.",
    icon: Wallet,
  },
  {
    title: "Analytics Dashboard",
    description: "Visualize attendance, fees, and growth with intuitive dashboards.",
    icon: TrendingUp,
  },
  {
    title: "Secure Cloud Access",
    description: "Role-based secure login with access from any device.",
    icon: Shield,
  },
];

const benefitItems = [
  {
    title: "Save Time",
    description: "Automate attendance and fee tracking so you can focus on teaching.",
  },
  {
    title: "Better Organization",
    description: "Keep teachers, batches, and students structured in one platform.",
  },
  {
    title: "Financial Clarity",
    description: "Monitor payments, due amounts, and monthly revenue at a glance.",
  },
  {
    title: "Access Anywhere",
    description: "Cloud-based platform that works from laptop, tablet, or mobile.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
              AT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Attendly</span>
              <span className="text-[11px] text-muted-foreground">Tuition Center Platform</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/#features" className="text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/#benefits" className="text-muted-foreground hover:text-foreground">
              Benefits
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Demo / Pricing
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
            <Link href="/register-center">
              <Button size="sm">Register Center</Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/demo"
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Demo / Pricing
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-16">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Modern SaaS for Tuition Centers
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Manage Your Tuition Center Easily with Attendly
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Attendly helps tuition centers manage teachers, students, attendance, and fees in one simple platform.
                Reduce manual work, avoid spreadsheets, and get a real-time view of your center&apos;s performance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/demo">
                <Button size="lg" className="gap-2">
                  View Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Multi-center ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure role-based access</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                <span>Access from anywhere</span>
              </div>
            </div>
          </div>

          {/* Dashboard mock illustration */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-linear-to-tr from-primary/10 via-primary/5 to-transparent blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
              <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live center overview
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Attendly Dashboard
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Students this month</p>
                    <p className="mt-1 text-2xl font-semibold">184</p>
                    <p className="mt-1 text-[11px] text-emerald-500">+18 new enrollments</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Attendance rate</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-2xl font-semibold">93%</p>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500">
                        Stable
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Monthly fees collected</p>
                    <p className="mt-1 text-2xl font-semibold">₹1,24,500</p>
                    <p className="mt-1 text-[11px] text-amber-500">₹18,000 pending</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Upcoming classes</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <li>Maths – Grade 10 – 4:00 PM</li>
                      <li>Physics – Grade 12 – 6:00 PM</li>
                      <li>English – Grade 8 – 7:30 PM</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="border-t border-border bg-muted/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>Track teachers, students, attendance, and fees in one view.</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    <TrendingUp className="h-3 w-3" />
                    Growth insights included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Features Preview */}
        <section id="features" className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything You Need to Manage Your Tuition Center
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Attendly brings all essential tools for tuition centers into one simple, well-organized dashboard.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Why Tuition Centers Choose Attendly
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Built specifically for tuition centers that want clarity, control, and growth.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefitItems.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final Call To Action */}
        <section className="mt-16 rounded-2xl border border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start Managing Your Tuition Center Today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Register your center in a few minutes and let Attendly handle the admin work while you focus on your
            students.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register-center">
              <Button size="lg" className="gap-2">
                Register Your Center
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="secondary">
                View Demo
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
