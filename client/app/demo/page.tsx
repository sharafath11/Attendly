import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  TrendingUp,
  Shield,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/button";

const howItWorksSteps = [
  {
    title: "Register Your Tuition Center",
    description: "Create your center account and select a subscription plan that matches your size.",
    icon: GraduationCap,
  },
  {
    title: "Admin Verifies Payment",
    description: "Platform administrator verifies your payment and activates your center account.",
    icon: Shield,
  },
  {
    title: "Add Teachers and Students",
    description: "Create teacher logins and register students with batch, subjects, and fees.",
    icon: Users,
  },
  {
    title: "Track Attendance and Fees",
    description: "Teachers mark daily attendance while owners track fee status in real time.",
    icon: CalendarCheck,
  },
  {
    title: "View Analytics Dashboard",
    description: "See attendance trends, revenue reports, and student growth at a glance.",
    icon: TrendingUp,
  },
];

const featureItems = [
  {
    title: "Teacher Management",
    description: "Create teacher accounts, assign subjects, and control permissions.",
    icon: Users,
  },
  {
    title: "Student Management",
    description: "Maintain complete student profiles with batch and fee details.",
    icon: GraduationCap,
  },
  {
    title: "Batch & Subject Management",
    description: "Organize classes by batch, medium, and subjects with clear schedules.",
    icon: CalendarCheck,
  },
  {
    title: "Attendance Tracking",
    description: "Mark attendance quickly and review absentees per batch and date.",
    icon: CheckCircle2,
  },
  {
    title: "Student Fee Management",
    description: "Track monthly fee payments, pending dues, and payment methods.",
    icon: Wallet,
  },
  {
    title: "Teacher Salary Tracking",
    description: "Record monthly teacher payments with clear history.",
    icon: Wallet,
  },
  {
    title: "Analytics Dashboard",
    description: "Visualize revenue, enrollment, and attendance KPIs in one dashboard.",
    icon: TrendingUp,
  },
  {
    title: "Secure Login System",
    description: "Role-based secure access for center owners and teachers.",
    icon: Shield,
  },
];

export default function DemoPage() {
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
              className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground bg-secondary"
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
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground bg-secondary"
            >
              Demo / Pricing
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-16">
        {/* Hero Section */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Demo & Pricing
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                See How Attendly Simplifies Tuition Center Management
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                A complete platform to manage teachers, students, attendance, and fees — with subscription plans
                designed for growing tuition centers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register-center">
                <Button size="lg" className="gap-2">
                  Register Your Center
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="secondary">
                  Contact Us
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Get started in minutes — no complicated setup or hardware required.
            </p>
          </div>

          {/* Dashboard preview illustration */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-linear-to-tr from-primary/10 via-primary/5 to-transparent blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/5">
              <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Demo preview
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Attendly UI
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Center snapshot</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <li>Active students: 184</li>
                      <li>Teachers: 7</li>
                      <li>Batches running today: 12</li>
                    </ul>
                  </div>
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Today&apos;s attendance</p>
                    <p className="mt-1 text-2xl font-semibold">91%</p>
                    <p className="mt-1 text-[11px] text-emerald-500">Most batches above 85% attendance</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Fees overview</p>
                    <p className="mt-1 text-2xl font-semibold">₹1,24,500</p>
                    <p className="mt-1 text-[11px] text-amber-500">₹18,000 pending from 9 students</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Teacher payouts</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <li>Next payout: ₹22,000</li>
                      <li>Salary status: All on time</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="border-t border-border bg-muted/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>Data shown is for demonstration purposes only.</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    <TrendingUp className="h-3 w-3" />
                    Built for growing centers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Attendly Works */}
        <section className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How Attendly Works</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              A clear, step-by-step workflow from registration to daily operations.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {howItWorksSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>Step {index + 1}</span>
                </div>
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Powerful Features for Tuition Centers
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Everything you need to run daily operations smoothly, from attendance to payouts.
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

        {/* Pricing Plans */}
        <section className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple Pricing</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Choose a plan that fits your tuition center. Upgrade as you grow.
            </p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Basic Plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Basic Plan</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Ideal for small tuition centers getting started.</p>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">₹250</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Up to 5 teachers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Unlimited students
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Attendance tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Student fee management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Basic analytics dashboard
                </li>
              </ul>
              <div className="mt-6">
                <Button size="lg" className="w-full">
                  Choose Basic Plan
                </Button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative flex flex-col rounded-2xl border border-primary bg-gradient-to-b from-primary/10 via-background to-background p-6 shadow-md shadow-primary/10 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                Most Popular
              </div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Premium Plan</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For growing centers managing more teachers and batches.
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">₹500</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Up to 10 teachers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Unlimited students
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Attendance tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Student fee management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Teacher salary management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Advanced analytics dashboard
                </li>
              </ul>
              <div className="mt-6">
                <Button size="lg" className="w-full">
                  Choose Premium Plan
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Activation Explanation */}
        <section className="mt-16 rounded-2xl border border-border bg-linear-to-b from-background via-card to-muted px-6 py-8 sm:px-10">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">How Activation Works</h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            After registering your tuition center, select a subscription plan. The administrator verifies your payment
            and activates your center account. Once activated, you can start managing teachers, students, attendance,
            and fees through the Attendly dashboard.
          </p>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mt-16 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Need Help or Want a Demo?</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Reach out to us for a guided walkthrough of Attendly or any questions about pricing and setup.
            </p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div className="rounded-2xl border border-border bg-card p-6 text-sm shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">+91 6282560928</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">sharafathabi@gmail.com</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/916282560928?text=Hello%20I%20am%20interested%20in%20Attendly%20Tuition%20Center%20Management%20Platform%20Can%20I%20get%20more%20information"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm">
              <p className="text-sm text-muted-foreground">
                Share your tuition center size, number of teachers, and current tools. We&apos;ll suggest the best plan
                and help you get started quickly.
              </p>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ready to start?</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/register-center">
                    <Button size="md" className="gap-2">
                      Register Your Center
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="md" variant="secondary">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final Call To Action */}
        <section className="mt-16 rounded-2xl border border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start Managing Your Tuition Center Today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Join Attendly and get a clear, real-time picture of your students, teachers, attendance, and fees.
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

