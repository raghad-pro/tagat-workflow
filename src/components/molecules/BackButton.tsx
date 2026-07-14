"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";

export function BackButton() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <button
      onClick={() => router.back()}
      className="group absolute top-6 left-6 rtl:left-auto rtl:right-6 flex items-center justify-center w-11 h-11 rounded-full bg-white/50 dark:bg-[#1a1c23]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-[var(--color-primary)] dark:hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white dark:hover:text-white hover:shadow-[0_0_20px_rgba(30,195,204,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 z-50 text-gray-700 dark:text-gray-200"
      aria-label="Go back"
    >
      <div className={isRtl ? "rotate-180" : "transition-transform group-hover:-translate-x-1"}>
        <ArrowLeft size={22} strokeWidth={2} />
      </div>
    </button>
  );
}
