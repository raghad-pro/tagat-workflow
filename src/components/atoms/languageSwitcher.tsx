"use client";

import { useLocale } from "next-intl";
import { changeLocaleAction } from "@/i18n/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();

  const toggleLanguage = async () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    await changeLocaleAction(newLocale);
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-lg border border-[var(--color-border)] 
                 text-[var(--color-text-primary)] text-sm font-medium
                 hover:bg-[var(--color-bg-card)] transition-colors"
    >
      {locale === "ar" ? "EN" : "عر"}
    </button>
  );
}