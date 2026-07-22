"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps = {}) {
  const { theme: providerTheme } = useTheme();
  const [theme, setTheme] = useState<string>(providerTheme || "light");

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, [providerTheme]);

  const logoSrc = theme === "dark" ? "/logoDark.png" : "/logoLight.png";

  return (
    <img
      src={logoSrc}
      alt="Workflow"
      className={`w-full h-auto max-w-[140px] sm:max-w-[165px] mx-auto object-contain ${className || ""}`}
    />
  );
}