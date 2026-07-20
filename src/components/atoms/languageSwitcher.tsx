"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState<"en" | "ar">("en");

  useEffect(() => {
    // Check cookie on mount 
    const match = document.cookie.match(/(^| )locale=([^;]+)/);
    if (match) {
      setLocale(match[2] as "en" | "ar");
    }
  }, []);

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    setLocale(nextLocale);
    // Set cookie
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
    // Refresh the page to apply the language and direction
    window.location.reload();
  };

  return (
    <button
      type="button"
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-transparent transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)] relative"
      onClick={toggleLanguage}
      title={locale === "en" ? "تغيير إلى العربية" : "Change to English"}
    >
      <Globe size={18} className="sm:w-[20px] sm:h-[20px]" />
      <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-[var(--color-bg-form)] rounded px-0.5 text-[#22c8e0]">
        {locale === "en" ? "AR" : "EN"}
      </span>
    </button>
  );
}