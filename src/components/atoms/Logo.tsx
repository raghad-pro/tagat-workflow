"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";

export default function Logo() {
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
      className="w-full h-auto max-w-[150px] sm:max-w-[190px] mx-auto transform scale-[1.15] origin-center object-contain"
    />
  );
}