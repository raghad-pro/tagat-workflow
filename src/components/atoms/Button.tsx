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
  fullWidth?: boolean;
  halfWidth?: boolean;        // Added for half-width support
  className?: string;
}

// ─── Maps ──────────────────────────────────────────────────────────────────────
const variantMap: Record<ButtonVariant, string> = {
  solid:   "ds-btn-solid shadow-sm disabled:bg-[#BBEDF4] disabled:text-white dark:disabled:bg-[#BBEDF4]/40 dark:disabled:text-white/80 disabled:border-transparent",
  outline: "ds-btn-outline disabled:bg-[#BBEDF4] disabled:text-white disabled:border-[#BBEDF4] dark:disabled:bg-[#BBEDF4]/40 dark:disabled:text-white/80 dark:disabled:border-transparent",
  ghost:   "bg-slate-100 dark:bg-[#162232] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1c2a3e] border border-slate-200/80 dark:border-slate-700/60 transition-all disabled:bg-[#BBEDF4] disabled:text-white disabled:opacity-90",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8 ds-text-sm gap-1.5",
  md: "h-10 ds-text-sm gap-2",
  lg: "h-12 ds-text-base gap-2",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function Button({
  children,
  variant   = "solid",
  size      = "md",
  loading   = false,
  fullWidth = false,
  halfWidth = false,
  licon,
  ricon,
  className,
  disabled,
  ...props
}: ButtonProps) {

  // Dynamic padding based on whether there are children (text) or just icons
  const hasText = children !== undefined && children !== null && children !== "";
  
  const paddingClass = hasText
    ? (size === "sm" ? "px-3" : size === "md" ? "px-4" : "px-6")
    : (size === "sm" ? "w-8 px-0" : size === "md" ? "w-10 px-0" : "w-12 px-0"); // Icon-only square sizing

  const base = [
    "inline-flex items-center justify-center",
    "rounded-xl",
    "font-bold ds-leading-normal",
    "transition-all duration-200 cursor-pointer",
    "focus:outline-none",
    "disabled:cursor-not-allowed",
    "active:scale-[0.98] disabled:active:scale-100", // Disable scale on disabled
    halfWidth ? "w-1/2" : (fullWidth ? "w-full" : "w-auto"),
  ].join(" ");

  return (
    <button
      className={cn(base, paddingClass, variantMap[variant], sizeMap[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          {hasText && <span>Loading…</span>}
        </>
      ) : (
        <>
          {licon && <span className="shrink-0 flex items-center justify-center">{licon}</span>}
          {hasText && <span>{children}</span>}
          {ricon && <span className="shrink-0 flex items-center justify-center">{ricon}</span>}
        </>
      )}
    </button>
  );
}