"use client";
import { useTheme } from "@/providers/ThemeProvider";
import {Sun,Moon} from "@/assets/icons/icons";
import { Button } from "./Button";
export default function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      type="button"
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-transparent transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)]"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-inherit" />
      ) : (
        <Moon size={20} className="text-inherit" />
      )}
    </button>
  );
}