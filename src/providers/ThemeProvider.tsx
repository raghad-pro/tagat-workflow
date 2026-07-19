"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

function getCookie(key: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function persist(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", isDark);
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = getCookie("wf-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    persist("wf-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);