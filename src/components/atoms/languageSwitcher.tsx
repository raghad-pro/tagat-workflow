"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";

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
      className="p-2 ds-text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors uppercase"
      onClick={toggleLanguage}
      title="Change Language"
    >
      {locale === "en" ? "AR" : "EN"}
    </button>
  );
}