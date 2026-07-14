"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export function BackButton() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const tooltipText = isRtl ? "العودة للموقع" : "Back to website";

  return (
    <div className="z-50 flex items-center mb-2">
      <button
        onClick={() => router.back()}
        className="cursor-pointer flex items-center justify-center h-11 px-5 gap-2 rounded-full bg-white/50 dark:bg-[#1a1c23]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white dark:hover:text-white hover:shadow-[0_0_20px_rgba(30,195,204,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 text-gray-700 dark:text-gray-200 group"
        aria-label={tooltipText}
      >
        <div className={cn("transition-transform shrink-0", isRtl ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1")}>
          <ArrowLeft size={22} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold whitespace-nowrap">
          {tooltipText}
        </span>
      </button>
    </div>
  );
}
