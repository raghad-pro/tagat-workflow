"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Logo from "@/components/atoms/Logo"
import ThemeToggle from "@/components/atoms/ThemeButton"
import LanguageSwitcher from "@/components/atoms/languageSwitcher"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const t = useTranslations("Index")
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: "/", label: t("navHome") },
    { href: "#about", label: t("navAbout") },
    { href: "#features", label: t("navFeatures") },
    { href: "#pricing", label: t("navPricing") },
    { href: "#contact", label: t("footerContact") },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link, idx) => (
                <Link key={idx} href={link.href} className="text-sm font-medium ds-text-gray hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2 mr-2 rtl:ml-2 rtl:mr-0">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <Link href="/login" className="hidden lg:block text-sm font-medium hover:text-primary transition-colors">
              {t("navLogin")}
            </Link>
            <Button size="sm" className="hidden lg:flex rounded-full shadow-md shadow-primary/20">
              {t("navSignup")}
            </Button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 ds-text-gray hover:text-primary transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-border ds-bg px-4 py-6 space-y-6 shadow-xl">
          <div className="flex flex-col gap-4">
            {navLinks.map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="text-base font-medium hover:text-primary transition-colors px-2 py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="h-px border-border border-t w-full" />
          <div className="flex items-center gap-4 px-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button size="lg" variant="outline" className="w-full justify-center" onClick={() => setIsOpen(false)}>
              {t("navLogin")}
            </Button>
            <Button size="lg" className="w-full justify-center" onClick={() => setIsOpen(false)}>
              {t("navSignup")}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
