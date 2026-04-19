import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Users, CalendarCheck, Wallet, TrendingUp, Shield, Globe2 } from "lucide-react";
import { Button } from "@/components/button";
import { LandingScrollAnimations } from "@/components/landing/LandingScrollAnimations";

const conversionFeatures = [
  {
    title: "Mark attendance in seconds",
    description: "One tap per student — present, absent, or leave.",
    icon: CalendarCheck,
  },
  {
    title: "Send WhatsApp reminders automatically",
    description: "Fee nudges and alerts parents actually read.",
    icon: CheckCircle2,
  },
  {
    title: "Collect payments online",
    description: "Razorpay links you can share on WhatsApp.",
    icon: Wallet,
  },
  {
    title: "Keep parents informed",
    description: "A simple portal for attendance and fees.",
    icon: Users,
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
      <LandingScrollAnimations />
      {/* Navbar */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
              <Image
                src="/images/logo-light-v2.png"
                alt="Attendly logo"
                width={26}
                height={26}
                className="block dark:hidden"
              />
              <Image
                src="/images/logo-dark-v2.png"
                alt="Attendly logo"
                width={26}
                height={26}
                className="hidden dark:block"
              />
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
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
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
            <Link
              href="/login"
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Login
            </Link>
            <Link href="/register-center">
              <Button size="sm">Register Center</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-16">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6" data-landing-section>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Modern SaaS for Tuition Centers
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Stop Chasing Fees. Automate Your Tuition Center.
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Track attendance, collect fees, and send WhatsApp reminders automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register-center">
                <Button size="lg" className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.99]">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="secondary" className="transition-transform hover:scale-[1.02] active:scale-[0.99]">
                  View demo
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
          <div className="relative" data-landing-section>
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

        {/* Problem / pain */}
        <section className="mt-16 space-y-6" data-landing-section>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sound familiar?</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Managing attendance and fees manually is time-consuming and error-prone.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              "Manual tracking",
              "Missed payments",
              "Parent communication issues",
            ].map((t) => (
              <div
                key={t}
                className="rounded-xl border border-border bg-card px-4 py-5 text-center text-sm font-medium shadow-sm"
              >
                {t}
              </div>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section className="mt-16 space-y-4 rounded-2xl border border-border bg-muted/20 px-6 py-10 sm:px-10" data-landing-section>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">The simpler way</h2>
          <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
            Our platform automates everything — so you can focus on teaching.
          </p>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { title: "Automation", body: "Fee reminders and daily workflows on your schedule." },
              { title: "WhatsApp", body: "Parents get clear updates without you repeating yourself." },
              { title: "Payments", body: "Collect fees online with Razorpay and payment links." },
            ].map((x) => (
              <div key={x.title} className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
                <h3 className="font-semibold">{x.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{x.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Features Preview */}
        <section id="features" className="mt-16 space-y-6" data-landing-section>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built for real centers</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Four things owners use every week — nothing extra.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {conversionFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
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

        {/* How it works */}
        <section className="mt-16 space-y-6" data-landing-section>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Get running in an afternoon—no technical setup.
            </p>
          </div>
          <ol className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Add students", body: "Import batches and parent contacts." },
              { step: "2", title: "Mark attendance", body: "One tap per batch—done in minutes." },
              { step: "3", title: "Let Attendly follow up", body: "Reminders, alerts, and parent views." },
            ].map((s) => (
              <li key={s.step} className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
                <span className="text-xs font-bold text-primary">{s.step}</span>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Social proof */}
        <section className="mt-16 space-y-6" data-landing-section>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Trusted by growing centers</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-primary">1000+ students</p>
              <p className="text-sm text-muted-foreground">managed on Attendly across batches and branches.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-foreground">
                &ldquo;Fee follow-ups used to eat my evenings. Now parents get WhatsApp reminders and I see who paid in
                one screen.&rdquo;
              </blockquote>
              <p className="text-xs font-medium text-muted-foreground">— Center owner, Kerala</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-16 space-y-6" data-landing-section>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple plans</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Start small and upgrade when you need WhatsApp automation at scale.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Basic</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">For small centers</p>
              <p className="mt-2 text-sm text-muted-foreground">Core attendance, fees, batches, and reports.</p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Core dashboard</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Parent portal</li>
              </ul>
              <div className="mt-6">
                <Link href="/register-center">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Start trial
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-md">
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">For growing centers</p>
              <p className="mt-2 text-sm text-muted-foreground">WhatsApp automation, payment links, and advanced insights.</p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> WhatsApp fee & attendance alerts</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> Razorpay payment links</li>
              </ul>
              <div className="mt-6">
                <Link href="/demo">
                  <Button className="w-full sm:w-auto">Compare on demo</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="mt-16 space-y-6" data-landing-section>
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
        <section
          className="mt-16 rounded-2xl border border-border bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center sm:px-10"
          data-landing-section
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start managing your center smarter today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Register your center in a few minutes. Parents stay informed, fees come in faster, and you get your evenings
            back.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register-center">
              <Button size="lg" className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.99]">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="transition-transform hover:scale-[1.02] active:scale-[0.99]">
                View Demo
              </Button>
            </Link>
          </div>
        </section>

        <footer className="mx-auto mt-12 max-w-6xl border-t border-border px-4 pb-10 pt-8 text-center text-xs text-muted-foreground lg:px-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
            <Link href="/register-center" className="hover:text-foreground">
              Register
            </Link>
            <a href="mailto:support@attendly.app" className="hover:text-foreground">
              Contact
            </a>
            <span>© {new Date().getFullYear()} Attendly</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
