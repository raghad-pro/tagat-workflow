"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useNextTheme();
  const currentTheme = (resolvedTheme ?? theme) as Theme | undefined;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return {
    theme: currentTheme ?? "light",
    setTheme,
    toggleTheme,
    systemTheme,
    resolvedTheme,
  };
}
