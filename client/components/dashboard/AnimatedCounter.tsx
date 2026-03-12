"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedCounter({ value, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const target = { val: 0 };
    const tween = gsap.to(target, {
      val: value,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          const formatted = Math.round(target.val).toLocaleString();
          ref.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, prefix, suffix]);

  return <span ref={ref}>{`${prefix}${value.toLocaleString()}${suffix}`}</span>;
}
