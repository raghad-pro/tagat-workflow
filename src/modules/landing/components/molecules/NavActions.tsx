"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import ThemeToggle from "@/components/atoms/ThemeButton";
import LanguageSwitcher from "@/components/atoms/languageSwitcher";
import { Button } from "@/components/ui/button";

interface NavActionsProps {
  isMobile?: boolean;
  onActionClick?: () => void;
}

export function NavActions({ isMobile, onActionClick }: NavActionsProps) {
  const t = useTranslations("Index");

  if (isMobile) {
    return (
      <>
        <div className="flex items-center gap-4 px-2 mb-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/login" className="w-full">
            <Button size="lg" variant="outline" className="w-full justify-center" onClick={onActionClick}>
              {t("navLogin")}
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button size="lg" className="w-full justify-center shadow-lg shadow-primary/20" onClick={onActionClick}>
              {t("navSignup")}
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-4">
      <div className="flex items-center gap-2 mr-2 rtl:ml-2 rtl:mr-0">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors text-foreground">
        {t("navLogin")}
      </Link>
      <Link href="/register">
        <Button size="sm" className="rounded-full shadow-md shadow-primary/20 px-6">
          {t("navSignup")}
        </Button>
      </Link>
    </div>
  );
}
