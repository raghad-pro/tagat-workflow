"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "@/assets/icons/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, hasError, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn(
            "ds-border-input-color ds-text-sm ds-text-primary",
            "transition-all duration-300 rounded-xl",
            "hover:border-[var(--color-primary)] hover:shadow-[0_0_10px_rgba(18,194,233,0.15)]",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "focus-visible:border-[var(--color-primary)] focus-visible:shadow-[0_0_15px_rgba(18,194,233,0.25)]",
            hasError && "ds-border-error",
            className
          )}
          style={{ height: "var(--input-height)", paddingInlineEnd: "2.5rem" }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute end-3 top-1/2 -translate-y-1/2 ds-text-gray-200  transition-colors"
          tabIndex={-1}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";