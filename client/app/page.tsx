"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { 
  Database, ShieldCheck, RefreshCw, Smartphone, Layers, 
  CheckCircle2, XCircle, ChevronDown, CheckCircle
} from "lucide-react";
import { Button } from "@/components/button";
import { SupportChat } from "@/components/landing/SupportChat";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const painMatrixRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // States for Phase B countdown
  const [countdown, setCountdown] = useState(6);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // SECTION 1: HERO GSAP ANIMATION
    const words = document.querySelectorAll(".hero-word");
    gsap.fromTo(
      words,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.04, ease: "power4.out", duration: 0.8, delay: 0.2 }
    );

    gsap.fromTo(
      ".hero-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power3.out" }
    );

    // SECTION 2: THE LIVESTREAM WORKFLOW COMPONENT
    if (showcaseRef.current) {
      timelineRef.current = gsap.timeline({
        scrollTrigger: {
          trigger: showcaseRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1,
          onUpdate: (self) => {
            // Update countdown based on progress through the middle portion
            if (self.progress > 0.4 && self.progress < 0.7) {
              const p = (self.progress - 0.4) / 0.3;
              setCountdown(Math.max(0, Math.ceil(6 - p * 6)));
            } else if (self.progress <= 0.4) {
              setCountdown(6);
            } else {
              setCountdown(0);
            }
          },
        },
      });

      // Phase A: Submit action hover simulation
      timelineRef.current.to(".teacher-card", { scale: 0.96, duration: 0.2, ease: "power1.inOut" });
      timelineRef.current.to(".teacher-card", { scale: 1, duration: 0.2, ease: "power1.inOut" });

      // Phase B: Pipeline Pulse
      timelineRef.current.fromTo(
        ".pipeline-pulse",
        { top: "0%" },
        { top: "100%", duration: 2, ease: "none" }
      );

      // Phase C: Parent Phone opacity pop
      timelineRef.current.fromTo(
        ".parent-message",
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }

    // ADDITION 1: THE PAIN-POINT MATRIX (Split slide-in)
    if (painMatrixRef.current) {
      gsap.fromTo(
        ".pain-left",
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: painMatrixRef.current, start: "top 80%" } }
      );
      gsap.fromTo(
        ".pain-right",
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: painMatrixRef.current, start: "top 80%" } }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const heroTitle = "Tuition Center Management. Redefined to a Single WhatsApp Trigger.".split(" ");

  const featureMatrix = [
    {
      title: "Dynamic Cohort Curriculum",
      description: "Subjects inherit directly from Batch configs. No redundant student setup strings.",
      icon: <Layers className="h-5 w-5 text-[#10b981]" />
    },
    {
      title: "Reactive Score Grids",
      description: "Roster loaders embedded with total marks input lock protection to ban entry mistakes.",
      icon: <Database className="h-5 w-5 text-[#10b981]" />
    },
    {
      title: "GridFS Remote Auth Persistence",
      description: "WhatsApp sessions sync to core Mongo GridFS clusters. Zero recurring QR logouts on server reboots.",
      icon: <ShieldCheck className="h-5 w-5 text-[#10b981]" />
    },
    {
      title: "Attendance State Correction",
      description: "Live delta updates. Shifting an attendance marker automatically issues a WhatsApp override alert to parents.",
      icon: <RefreshCw className="h-5 w-5 text-[#10b981]" />
    },
    {
      title: "Multi-Tenant OTP Security",
      description: "Conflict-free single-child views verified purely through WhatsApp OTP authentication keys.",
      icon: <Smartphone className="h-5 w-5 text-[#10b981]" />
    }
  ];

  const faqs = [
    {
      q: "Will my WhatsApp number get banned for sending automated messages?",
      a: "No. Attendly routes all alerts through a proprietary 6-second human-mimicking delay queue with text mutations to shield your line."
    },
    {
      q: "How do parents login if they have multiple children in different centers?",
      a: "Through our secure multi-tenant searchable combobox. Parents select the center, enter their number, and verify instantly via a WhatsApp OTP."
    },
    {
      q: "What if my server restarts? Do I have to scan the QR code again?",
      a: "Never. Your active login tokens are continuously backed up directly to our secure database cluster using MongoDB GridFS RemoteAuth."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-[#090a0b] dark:text-white selection:bg-[#10b981]/30 selection:text-white transition-colors duration-300" ref={containerRef}>
      {/* Subtle radial mesh background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <header className="relative z-10 border-b border-border dark:border-white/5 bg-background/80 dark:bg-[#090a0b]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border dark:border-white/10 bg-background dark:bg-white/5 overflow-hidden">
              <Image src="/images/logo-light-v2.png" alt="Attendly logo" width={26} height={26} className="block dark:hidden" />
              <Image src="/images/logo-dark-v2.png" alt="Attendly logo" width={26} height={26} className="hidden dark:block" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground dark:text-white">Attendly</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground dark:text-neutral-400 dark:hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground dark:text-neutral-400 dark:hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register-center">
              <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white border-0">Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24 space-y-32 overflow-hidden">
        
        {/* SECTION 1: HERO */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto" ref={heroRef}>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 hero-text">
            {heroTitle.map((word, i) => (
              <span key={i} className="inline-block hero-word mr-3 lg:mr-4">
                {word}
              </span>
            ))}
          </h1>
          <p className="hero-sub text-lg sm:text-xl text-muted-foreground dark:text-neutral-400 leading-relaxed max-w-3xl mb-10">
            Stop chasing fees and manual entries. Automate student onboarding, record marks with step-by-step validation, and keep parents connected via dynamic WhatsApp alerts with zero-lag delivery.
          </p>
          <div className="hero-sub flex items-center justify-center gap-4">
             <Link href="/register-center">
              <Button size="lg" className="bg-[#10b981] hover:bg-[#059669] text-white border-0 px-8 py-6 text-base font-semibold shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                Start Building Your Roster
              </Button>
            </Link>
          </div>
        </section>

        {/* SECTION 2: LIVE WORKFLOW SHOWCASE */}
        <section ref={showcaseRef} className="max-w-4xl mx-auto border border-border dark:border-neutral-800/50 rounded-2xl bg-card/50 dark:bg-[#111315]/50 backdrop-blur-xl p-8 relative">
          <div className="absolute -top-3 left-8 px-2 bg-background dark:bg-[#090a0b] text-xs font-mono text-[#10b981] uppercase tracking-widest border border-border dark:border-[#064e3b]/50 rounded-full">
            LiveWorkflowShowcase
          </div>
          
          <div className="grid md:grid-cols-[1fr_40px_1fr] gap-8 items-center mt-4">
            
            {/* Phase A: Teacher Matrix */}
            <div className="teacher-card rounded-xl border border-border dark:border-neutral-800 bg-card dark:bg-[#090a0b] p-6 shadow-2xl relative z-10">
              <div className="flex items-center gap-2 mb-4 border-b border-border dark:border-neutral-800 pb-4">
                <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-foreground dark:text-white">Teacher Matrix</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-neutral-500">Batch Subject</label>
                  <div className="h-9 w-full bg-muted dark:bg-neutral-900 rounded border border-border dark:border-neutral-800 flex items-center px-3 text-sm text-foreground dark:text-neutral-300">
                    Mathematics (Inherited)
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-neutral-500">Total Marks</label>
                    <div className="h-9 w-full bg-muted dark:bg-neutral-900 rounded border border-border dark:border-neutral-800 flex items-center px-3 text-sm text-foreground dark:text-neutral-300">50</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-neutral-500">Score</label>
                    <div className="h-9 w-full bg-[#10b981]/10 rounded border border-[#10b981]/30 flex items-center px-3 text-sm text-[#10b981] font-bold">45</div>
                  </div>
                </div>
                <button className="w-full h-10 rounded bg-primary dark:bg-white text-primary-foreground dark:text-black text-sm font-semibold mt-2 opacity-90 cursor-default">
                  Submit Score
                </button>
              </div>
            </div>

            {/* Phase B: The Safe Pipeline */}
            <div className="hidden md:flex flex-col items-center justify-center h-full relative">
              <div className="h-full w-[2px] bg-border dark:bg-neutral-800 relative overflow-hidden">
                <div className="pipeline-pulse absolute w-full h-1/3 bg-gradient-to-b from-transparent via-[#10b981] to-transparent -top-[33%]" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-[#090a0b] border border-[#10b981]/30 text-[#10b981] px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]">
                {countdown}s queue
              </div>
            </div>
            
            {/* Phase C: Parent Display */}
            <div className="rounded-[2rem] border-4 border-border dark:border-neutral-800 bg-card dark:bg-[#090a0b] p-2 relative h-[360px] overflow-hidden shadow-2xl flex flex-col z-10">
              <div className="absolute top-0 inset-x-0 h-6 bg-border dark:bg-neutral-800 rounded-b-xl w-32 mx-auto z-20" />
              <div className="flex-1 bg-muted dark:bg-[#111315] rounded-[1.5rem] p-4 flex flex-col justify-end pb-8">
                <div className="parent-message bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl rounded-bl-none p-4 w-[90%] self-start transform-gpu">
                  <div className="text-[10px] text-[#10b981] font-bold mb-1 uppercase tracking-wider">Attendly Alert</div>
                  <p className="text-sm text-foreground dark:text-neutral-200 leading-snug">
                    Dear Parent, Progress Report from Attendly. Your child scored <strong className="text-foreground dark:text-white">45 / 50</strong> in Maths held today.
                  </p>
                  <p className="text-[9px] text-muted-foreground dark:text-neutral-500 mt-2">(Ref: 14:05:22)</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ADDITION 1: THE PAIN-POINT MATRIX */}
        <section ref={painMatrixRef} className="max-w-5xl mx-auto overflow-hidden">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Sound Familiar?</h2>
            <p className="text-muted-foreground dark:text-neutral-400 mt-3 max-w-2xl mx-auto">The old way of running a tuition center is built on broken workflows and endless friction.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-border dark:bg-neutral-800 -translate-x-1/2" />
            
            <div className="pain-left space-y-6">
              <h3 className="text-xl font-semibold text-destructive flex items-center gap-2">
                <XCircle className="w-5 h-5" /> The Manual Chaos
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-muted-foreground dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive/50 mt-2 shrink-0" />
                  <p>Spending hours logging attendance on paper, risking manual errors and lost records.</p>
                </li>
                <li className="flex gap-3 text-muted-foreground dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive/50 mt-2 shrink-0" />
                  <p>Losing track of pending fees, leading to awkward conversations with parents.</p>
                </li>
                <li className="flex gap-3 text-muted-foreground dark:text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive/50 mt-2 shrink-0" />
                  <p>Typing hundreds of WhatsApp updates manually every week after exams.</p>
                </li>
              </ul>
            </div>

            <div className="pain-right space-y-6">
              <h3 className="text-xl font-semibold text-[#10b981] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> The Attendly Way
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-foreground dark:text-neutral-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p>One-tap batch attendance that instantly syncs across the cloud.</p>
                </li>
                <li className="flex gap-3 text-foreground dark:text-neutral-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p>Manual Financial Reconciliation — Effortlessly log tuition fees received via Cash, UPI apps, or Bank Transfer directly into the owner dashboard.</p>
                </li>
                <li className="flex gap-3 text-foreground dark:text-neutral-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p>One-Click WhatsApp Nudges — Identify pending fee statuses instantly and broadcast structured fee reminders to parents using our safe 6-second delay queue.</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ADDITION 2: TRUST INSIGHTS & REGIONAL TESTIMONIALS */}
        <section className="max-w-4xl mx-auto py-12">
          <div className="border border-border dark:border-[#1f2428] rounded-2xl bg-card/30 dark:bg-[#090a0b]/30 p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-[#10b981]/10 text-primary dark:text-[#10b981] text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20 dark:border-[#10b981]/20">
              <Database className="w-3 h-3" />
              1000+ Students Managed Globally
            </div>
            <blockquote className="text-xl md:text-2xl font-medium leading-relaxed text-foreground dark:text-white max-w-3xl mx-auto">
              “Fee follow-ups used to eat my evenings. Now parents get automated WhatsApp reminders with 6-second anti-ban delays, and I see exactly who paid in one clean screen.”
            </blockquote>
            <p className="mt-6 text-sm text-muted-foreground dark:text-neutral-500 font-medium tracking-wide">
              — Center Owner, Kerala
            </p>
          </div>
        </section>

        {/* SECTION 3: EXPANDED RE-ALIGNED FEATURE MATRIX */}
        <section className="max-w-6xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white mb-3">Enterprise Architecture</h2>
            <p className="text-muted-foreground dark:text-neutral-400">Strictly engineered models supporting millions of rows without data bleeding.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureMatrix.map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3, borderColor: '#10b981' }}
                transition={{ duration: 0.2 }}
                className="border border-border dark:border-neutral-800 rounded-lg bg-card dark:bg-[#111315] p-6 flex flex-col h-full"
              >
                <div className="h-10 w-10 rounded bg-muted dark:bg-[#090a0b] border border-border dark:border-neutral-800 flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-neutral-400 leading-relaxed flex-1">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ADDITION 3: SMART MULTI-TENANT PRICING BLOCKS */}
        <section className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Transparent Plans</h2>
            <p className="text-muted-foreground dark:text-neutral-400 mt-3 max-w-2xl mx-auto">Built to scale securely with your operations.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            
            <motion.div whileHover={{ y: -5 }} className="rounded-2xl border border-border dark:border-neutral-800 bg-card dark:bg-[#111315] p-8 flex flex-col shadow-sm transition-shadow hover:shadow-xl">
              <h3 className="text-2xl font-bold text-foreground dark:text-white">Basic</h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-neutral-400">For Growing Centers</p>
              <div className="my-6 h-[1px] w-full bg-border dark:bg-neutral-800" />
              <ul className="space-y-4 flex-1">
                {['Core attendance tracker', 'Batch management', 'Dynamic subject inheritance', 'Secure parent portal view'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground dark:text-neutral-300">
                    <CheckCircle className="w-5 h-5 text-muted-foreground dark:text-neutral-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register-center" className="mt-8">
                <Button variant="outline" className="w-full">Start Building</Button>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="rounded-2xl border-2 border-[#10b981] bg-card dark:bg-[#111315] p-8 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[#10b981] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                Recommended
              </div>
              <h3 className="text-2xl font-bold text-foreground dark:text-white">Pro Plan</h3>
              <p className="mt-2 text-sm text-[#10b981]">For Enterprise Automation</p>
              <div className="my-6 h-[1px] w-full bg-border dark:bg-neutral-800" />
              <ul className="space-y-4 flex-1">
                {['Everything in Basic', 'Autonomous 6-Second Delay WhatsApp Queue', 'Automatic Attendance State Correction alerts', 'Manual Fee Tracking & WhatsApp Dues Alerts', 'Crash-proof GridFS Remote Auth'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground dark:text-neutral-200">
                    <CheckCircle className="w-5 h-5 text-[#10b981] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/demo" className="mt-8">
                <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-white border-0 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">Go Pro</Button>
              </Link>
            </motion.div>

          </div>
        </section>

        {/* ADDITION 4: TRANSPARENT TRUST FAQ SECTION */}
        <section className="max-w-3xl mx-auto pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Trust & Security FAQs</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-border dark:border-neutral-800 rounded-lg bg-card dark:bg-[#111315] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-muted/50 dark:hover:bg-neutral-900/50"
                >
                  <span className="font-semibold text-foreground dark:text-white text-sm md:text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground dark:text-neutral-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground dark:text-neutral-400 leading-relaxed border-t border-border dark:border-neutral-800 mt-2 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-border dark:border-neutral-800/50 bg-background dark:bg-[#090a0b] py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground dark:text-neutral-600">
           © {new Date().getFullYear()} Attendly OS. Production Verified.
        </div>
      </footer>

      <SupportChat />
    </div>
  );
}
