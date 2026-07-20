"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  licon?:     ReactNode;
  ricon?:     ReactNode;
  fullWidth?: boolean;        // ← اختياري بدل w-full دايماً
  className?: string;
}

// ─── Maps ──────────────────────────────────────────────────────────────────────
const variantMap: Record<ButtonVariant, string> = {
  solid:   "bg-gradient-to-r from-[#22c8e0] to-[#0ea5e9] text-white hover:opacity-95 font-bold shadow-sm shadow-[#22c8e0]/20 active:scale-[0.98]",
  outline: "bg-transparent border border-[#22c8e0]/40 text-[#22c8e0] hover:bg-[#22c8e0]/10 font-bold",
  ghost:   "bg-slate-100 dark:bg-[#162232] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c2a3e] border border-slate-200/80 dark:border-slate-700/60 font-bold transition-all",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8  px-3 ds-text-sm  gap-1.5",
  md: "h-10 px-4 ds-text-sm  gap-2",
  lg: "h-12 px-6 ds-text-base gap-2",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant   = "solid",
  size      = "md",
  loading   = false,
  fullWidth = false,
  licon,
  ricon,
  className,
  disabled,
  ...props
}: ButtonProps) {

  const base = [
    "inline-flex items-center justify-center",
    "rounded-xl",                          // ← زي الصورة
    "ds-font-bold ds-leading-normal",
    "transition-all duration-200 cursor-pointer",
    "focus:outline-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.98]",
    fullWidth ? "w-full" : "w-auto",       // ← مش دايماً full
  ].join(" ");

  return (
    <button
      className={cn(base, variantMap[variant], sizeMap[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Loading…
        </>
      ) : (
        <>
          {licon && <span className="shrink-0">{licon}</span>}
          {children}
          {ricon && <span className="shrink-0">{ricon}</span>}
        </>
      )}
    </button>
  );
}