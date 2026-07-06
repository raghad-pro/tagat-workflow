"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import { Menu, X } from "lucide-react";
import { NavActions } from "../molecules/NavActions";
import { cn } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("Index");
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("navHome") },
    { href: "#about", label: t("navAbout") },
    { href: "#features", label: t("navFeatures") },
    { href: "#pricing", label: t("navPricing") },
    { href: "#contact", label: t("footerContact") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center transition-transform hover:scale-105">
              <Logo />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, idx) => (
                <Link 
                  key={idx} 
                  href={link.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <NavActions />

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out absolute w-full bg-background/95 backdrop-blur-xl shadow-xl",
          isOpen ? "max-h-[500px] opacity-100 border-b border-white/5" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-6 space-y-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="h-px bg-border/50 w-full" />
          <NavActions isMobile onActionClick={() => setIsOpen(false)} />
        </div>
      </div>
    </nav>
  );
}
