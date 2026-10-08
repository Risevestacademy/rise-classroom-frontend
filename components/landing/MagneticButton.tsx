"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A button that leans toward the pointer while it's near, and springs back
 * when it leaves. The label leans a little further than the button, which
 * gives it depth. Still for reduced motion and touch.
 */
export function MagneticButton({ className, children, ...props }: React.ComponentProps<"button">) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);

  function move(event: React.PointerEvent<HTMLButtonElement>) {
    const button = buttonRef.current;
    if (!button || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    button.style.transform = `translate3d(${x * 0.28}px, ${y * 0.28}px, 0)`;
    if (labelRef.current) labelRef.current.style.transform = `translate3d(${x * 0.14}px, ${y * 0.14}px, 0)`;
  }

  function leave() {
    if (buttonRef.current) buttonRef.current.style.transform = "";
    if (labelRef.current) labelRef.current.style.transform = "";
  }

  return (
    <button
      ref={buttonRef}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn(
        "group/magnet relative cursor-pointer overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30",
        className
      )}
      {...props}
    >
      {/* A darker fill rises from below on hover. */}
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-[inherit] bg-neutral-800 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/magnet:translate-y-0"
      />
      <span
        ref={labelRef}
        className="relative block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        {children}
      </span>
    </button>
  );
}
