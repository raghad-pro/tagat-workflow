"use client";

import ThemeButton from "@/components/atoms/ThemeButton";
import LanguageSwitcher from "@/components/atoms/languageSwitcher";
import { useAuth } from "@/providers/AuthProvider";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 ds-bg-card ds-border-color border-b ds-shadow-sm">
      <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">

        {/* ── اليسار: اسم المنصة ── */}
        <span className="ds-text-lg ds-font-bold ds-text-primary">
          Workflow
        </span>

        {/* ── اليمين: أدوات ── */}
        <div className="flex items-center gap-3">
          {/* اسم المستخدم */}
          {user?.name && (
            <span className="ds-text-sm ds-text-secondary hidden sm:block">
              {user.name}
            </span>
          )}

          {/* تغيير اللغة */}
          <LanguageSwitcher />

          {/* تغيير الثيم */}
          <ThemeButton />
        </div>

      </div>
    </header>
  );
}