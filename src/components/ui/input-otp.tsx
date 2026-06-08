"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── InputOTP ────────────────────────────────────────────────────────────────
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

// ─── InputOTPGroup ───────────────────────────────────────────────────────────
const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

// ─── InputOTPSlot ─────────────────────────────────────────────────────────────
const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, style, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        // ── base styles ──────────────────────────────────────────────────────
        "relative flex items-center justify-center",
        "transition-all duration-200",
        "text-lg font-bold ds-text-primary",
        // ── focus ring بلون البريمري لما يكون الـ slot نشط ───────────────────
        isActive && "ring-2 ring-[var(--color-primary)] z-10",
        className
      )}
      style={style}
      {...props}
    >
      {/* الرقم المكتوب */}
      {char}

      {/* مؤشر الكتابة (caret) */}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-current opacity-70" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

// ─── InputOTPSeparator ───────────────────────────────────────────────────────
const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

// ─── Exports ─────────────────────────────────────────────────────────────────
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };