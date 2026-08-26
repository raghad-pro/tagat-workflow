"use client";

import { Globe } from "lucide-react";
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher";

export default function LanguageSwitcher() {
  // Reads the same cookie next-intl rendered this page from, so the badge can
  // no longer disagree with the language actually on screen (it used to start
  // at "en" and correct itself in an effect, flashing the wrong label).
  const { locale, toggleLocale, isPending } = useLocaleSwitcher();

  return (
    <button
      type="button"
      className="size-10 sm:size-9 flex items-center justify-center rounded-xl bg-transparent transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)] relative disabled:opacity-60"
      onClick={toggleLocale}
      disabled={isPending}
      aria-label={locale === "en" ? "تغيير إلى العربية" : "Change to English"}
      title={locale === "en" ? "تغيير إلى العربية" : "Change to English"}
    >
      <Globe size={20} />
      <span className="absolute -bottom-1 -end-1 text-[9px] font-bold bg-[var(--color-bg-form)] rounded px-0.5 text-[#22c8e0]">
        {locale === "en" ? "AR" : "EN"}
      </span>
    </button>
  );
}
