"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Server, Send, CheckCircle2 } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LiveWorkflowShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const pulseLineRef = useRef<HTMLDivElement>(null);
  const pulseLineRefVertical = useRef<HTMLDivElement>(null);
  const queueBoxRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const scoreInputRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        }
      });

      // Scene A: Reset states
      tl.set(scoreInputRef.current, { width: "100%" })
        .set(submitBtnRef.current, { scale: 1 })
        .set([pulseLineRef.current, pulseLineRefVertical.current], { x: "-100%", y: "-100%", opacity: 0 })
        .set(queueBoxRef.current, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none" })
        .set(notificationRef.current, { scale: 0, opacity: 0, y: 20 });

      // Scene A: Type the score (width animates from 100% masking to 0%)
      tl.to(scoreInputRef.current, { width: "0%", duration: 1, ease: "steps(2)" })
        // Submit click
        .to(submitBtnRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" })
        
      // Scene B: Pulse travels to Queue
        .to([pulseLineRef.current, pulseLineRefVertical.current], { opacity: 1, duration: 0.1 })
        .to([pulseLineRef.current, pulseLineRefVertical.current], { x: "0%", y: "0%", duration: 0.5, ease: "power2.out" })
        
      // Scene B: Queue processing & Countdown
        .to(queueBoxRef.current, { 
          borderColor: "#10b981", 
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.3)",
          duration: 0.3 
        })
        .to({ val: 6 }, {
          val: 0,
          duration: 3, // Simulate 6 seconds fast
          ease: "none",
          onUpdate: function() {
            setCountdown(Math.ceil(this.targets()[0].val));
          }
        })
        .to(queueBoxRef.current, { 
          borderColor: "rgba(255,255,255,0.1)", 
          boxShadow: "none",
          duration: 0.3 
        })
        
      // Scene C: Pulse travels to Phone
        .to([pulseLineRef.current, pulseLineRefVertical.current], { x: "100%", y: "100%", duration: 0.5, ease: "power2.in" })
        .to([pulseLineRef.current, pulseLineRefVertical.current], { opacity: 0, duration: 0.1 })
        
      // Scene C: Notification pops up
        .to(notificationRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full relative py-10" data-landing-section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 items-center">
        
        {/* SCENE A: Teacher Input */}
        <div className="bg-[#090a0b] border border-border rounded-2xl p-6 shadow-2xl relative z-10 flex flex-col gap-4 text-white">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Teacher Module
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5">
              <span className="text-xs text-gray-400">Exam Total</span>
              <span className="text-sm font-medium">50</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg border border-white/5">
              <span className="text-xs text-gray-400">Student Score</span>
              <div className="relative w-8 h-5 flex items-center justify-end">
                <span className="text-sm font-medium absolute">45</span>
                <div ref={scoreInputRef} className="absolute right-0 bg-[#090a0b] h-full w-full z-10 origin-right"></div>
              </div>
            </div>
          </div>
          <button ref={submitBtnRef} className="mt-2 w-full bg-[#10b981] hover:bg-[#0da070] text-[#090a0b] font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
            <Send size={16} /> Submit Marks
          </button>
        </div>

        {/* SCENE B: Queue & Anti-Ban Delay */}
        <div className="flex flex-col items-center justify-center relative min-h-[160px]">
          {/* Background circuit path */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 hidden md:block"></div>
          <div className="absolute left-1/2 top-0 h-full w-[2px] bg-white/5 -translate-x-1/2 block md:hidden"></div>
          
          {/* Moving Pulse Line Horizontal */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] overflow-hidden -translate-y-1/2 hidden md:block z-0">
            <div ref={pulseLineRef} className="w-full h-full bg-gradient-to-r from-transparent via-[#10b981] to-transparent"></div>
          </div>

          {/* Moving Pulse Line Vertical */}
          <div className="absolute top-0 left-1/2 h-full w-[2px] overflow-hidden -translate-x-1/2 block md:hidden z-0">
            <div ref={pulseLineRefVertical} className="w-full h-full bg-gradient-to-b from-transparent via-[#10b981] to-transparent"></div>
          </div>
          
          {/* Queue Server Box */}
          <div ref={queueBoxRef} className="bg-[#111214] border border-border rounded-2xl p-6 z-10 flex flex-col items-center gap-3 w-44 text-white shadow-xl">
            <Server className="text-gray-400" size={28} />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">WhatsApp Queue</div>
              <div className="text-[#10b981] font-mono text-base font-bold bg-[#10b981]/10 px-3 py-1 rounded">
                {countdown}s...
              </div>
            </div>
          </div>
        </div>

        {/* SCENE C: Parent Delivery (Mobile Outline) */}
        <div className="relative flex justify-center z-10">
          <div className="w-[260px] h-[480px] border-8 border-[#2a2d33] rounded-[3rem] bg-[#090a0b] relative overflow-hidden shadow-2xl flex flex-col">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
              <div className="w-28 h-5 bg-[#2a2d33] rounded-b-2xl"></div>
            </div>
            
            {/* Screen Content */}
            <div className="flex-1 px-4 pt-12 pb-8 flex flex-col justify-end bg-gradient-to-b from-[#090a0b] to-[#111214]">
              
              {/* Notification Pop-up */}
              <div ref={notificationRef} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl origin-bottom transform">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white/90">Attendly Alert</span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed mt-1">
                  <strong className="text-white">Exam Update:</strong><br/>
                  John scored <strong className="text-[#10b981]">45/50</strong> in the recent Mathematics exam. View detailed progress on the parent portal.
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
