"use client";
import { useTranslations } from "next-intl";
import { useTheme } from "@/providers/ThemeProvider";
import {Sun,Moon} from "@/assets/icons/icons";
import { Button } from "./Button";
export default function ThemeButton() {
  const t = useTranslations("common");
  const { theme, toggleTheme } = useTheme();
  return (
    // Matches the other navbar triggers; `size-10` on phones keeps the tap
    // target usable.
    <button
      type="button"
      className="size-10 sm:size-9 flex items-center justify-center rounded-xl bg-transparent transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)]"
      onClick={toggleTheme}
      title={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-inherit" />
      ) : (
        <Moon size={20} className="text-inherit" />
      )}
    </button>
  );
}