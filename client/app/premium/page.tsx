"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Target, CheckSquare, Users } from "lucide-react";

// Register ScrollTrigger for Next.js SSR compatibility safely inside useEffect or conditionally
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PremiumLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Refs
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  
  // Modules Refs
  const modulesRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // WhatsApp Node Ref
  const nodeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Setup Context for cleanup
    const ctx = gsap.context(() => {
      // 1. HERO ANIMATION
      const words = headlineRef.current?.querySelectorAll(".word");
      if (words && words.length > 0) {
        gsap.from(words, {
          y: 40,
          opacity: 0,
          stagger: 0.05,
          duration: 1,
          ease: "power4.out",
          delay: 0.2,
        });
      }

      if (btnRef.current) {
        gsap.fromTo(
          btnRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1, delay: 1, ease: "power3.out" }
        );
      }

      // 2. CORE MODULES SHOWCASE (ScrollTrigger)
      if (cardsRef.current.length > 0) {
        gsap.from(cardsRef.current, {
          scrollTrigger: {
            trigger: modulesRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          y: 60,
          opacity: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
        });
      }

      // 3. WHATSAPP QUEUE RUNTIME LOOP
      if (nodeRef.current) {
        // A simple path sliding across the container
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
        
        // Node starts at left (Active Exam state)
        tl.fromTo(
          nodeRef.current,
          { x: "0%", opacity: 0, scale: 0.8 },
          { x: "15vw", opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
        )
        // Pulsing / waiting for 6s anti-ban delay (simulated as repeating pulses)
        .to(nodeRef.current, {
          scale: 1.1,
          boxShadow: "0 0 25px 8px rgba(16, 185, 129, 0.4)",
          repeat: 3,
          yoyo: true,
          duration: 1.5, // 1.5 * 4 = 6 seconds visual simulation
          ease: "sine.inOut"
        })
        // Dispatch to parent mobile screen
        .to(nodeRef.current, {
          x: "60vw",
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: "power2.in"
        });
      }
    }, containerRef); // Scope to container

    return () => ctx.revert(); // Cleanup on unmount!
  }, []);

  // Magnetic hover effect for CTA button
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btn, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  // Hover micro-lift for cards
  const handleCardEnter = (idx: number) => {
    if (cardsRef.current[idx]) {
      gsap.to(cardsRef.current[idx], {
        y: -4,
        borderColor: "#10b981", // Mint green border highlight
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  const handleCardLeave = (idx: number) => {
    if (cardsRef.current[idx]) {
      gsap.to(cardsRef.current[idx], {
        y: 0,
        borderColor: "rgba(255,255,255,0.1)", // Reset border to default
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  const headlineText = "Tuition Management. Simplified to a Single WhatsApp Alert.";
  const words = headlineText.split(" ");

  return (
    <div ref={containerRef} className="min-h-screen bg-[#090a0b] text-white font-sans overflow-x-hidden selection:bg-[#10b981] selection:text-[#090a0b]">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />
        
        <div className="z-10 flex flex-col items-center max-w-5xl text-center gap-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight flex flex-wrap justify-center gap-x-4 gap-y-2" ref={headlineRef}>
            {words.map((word, i) => (
              <span key={i} className="word inline-block overflow-hidden pb-2 relative">
                <span className="inline-block">{word}</span>
              </span>
            ))}
          </h1>
          
          <button
            ref={btnRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative px-10 py-5 bg-[#10b981] text-[#090a0b] font-semibold rounded-full text-lg shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-shadow"
          >
            <span className="relative z-10 flex items-center gap-2 pointer-events-none">
              Get Started for Free
            </span>
          </button>
        </div>
      </section>

      {/* 2. CORE MODULES SHOWCASE */}
      <section ref={modulesRef} className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Owner Dashboard */}
            <div 
              ref={el => { cardsRef.current[0] = el; }}
              onMouseEnter={() => handleCardEnter(0)}
              onMouseLeave={() => handleCardLeave(0)}
              className="group bg-[#111214] border border-white/10 rounded-2xl p-8 cursor-pointer flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl -translate-y-10 translate-x-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-[#10b981]/15" />
              <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#10b981]">
                <Target size={28} />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-2xl drop-shadow-md">👑</span> Owner Dashboard
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Global 360° student tracking and auto-synced GridFS database analytics.
                </p>
              </div>
            </div>

            {/* Card 2: Teacher Sheet */}
            <div 
              ref={el => { cardsRef.current[1] = el; }}
              onMouseEnter={() => handleCardEnter(1)}
              onMouseLeave={() => handleCardLeave(1)}
              className="group bg-[#111214] border border-white/10 rounded-2xl p-8 cursor-pointer flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl -translate-y-10 translate-x-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-[#10b981]/15" />
              <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#10b981]">
                <CheckSquare size={28} />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-2xl drop-shadow-md">👨‍🏫</span> Teacher Sheet
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Two-step smart exam creation with strict total marks cap validation.
                </p>
              </div>
            </div>

            {/* Card 3: Parent Feed */}
            <div 
              ref={el => { cardsRef.current[2] = el; }}
              onMouseEnter={() => handleCardEnter(2)}
              onMouseLeave={() => handleCardLeave(2)}
              className="group bg-[#111214] border border-white/10 rounded-2xl p-8 cursor-pointer flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl -translate-y-10 translate-x-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-[#10b981]/15" />
              <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#10b981]">
                <Users size={28} />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-2xl drop-shadow-md">👪</span> Parent Feed
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Tenant-isolated WhatsApp OTP login with live digital progress report cards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. LIVE WHATSAPP QUEUE RUNTIME INTERACTIVE GRAPHIC */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#090a0b] to-[#0c0d0f]">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">6-Second Anti-Ban Queue</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
              Sequential dispatch runtime safely routes notifications without blocking center channels.
            </p>
          </div>
          
          <div className="w-full h-48 md:h-64 bg-[#111214] border border-white/10 rounded-[2rem] relative flex items-center p-4 md:p-8 overflow-hidden shadow-2xl">
            {/* Visual Queue Path */}
            <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-white/5 -translate-y-1/2 border-t border-dashed border-white/20 z-0"></div>
            
            {/* Left Node (Server/Exam) */}
            <div className="z-10 bg-[#16181a] border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-lg ml-4 md:ml-8">
              <span className="text-xs text-gray-400 font-mono mb-2 tracking-wider">STATE</span>
              <span className="text-sm md:text-base font-semibold">Active Exam</span>
            </div>
            
            {/* Animated Payload Node */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center w-full z-20 pointer-events-none">
              <div 
                ref={nodeRef}
                className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              >
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-1"></div>

            {/* Right Node (Parent Device) */}
            <div className="z-10 bg-[#16181a] border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-lg min-w-[140px] mr-4 md:mr-8">
              <span className="text-xs text-gray-400 font-mono mb-2 tracking-wider">TARGET</span>
              <span className="text-sm md:text-base font-semibold text-[#10b981]">Parent Device</span>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
