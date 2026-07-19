import { useTranslations } from "next-intl"
import Link from "next/link"
import Logo from "@/components/atoms/Logo"
import ThemeToggle from "@/components/atoms/ThemeButton"
import LanguageSwitcher from "@/components/atoms/languageSwitcher"
import { Globe, Mail, MessageCircle, Link as LinkIcon } from "lucide-react"

export function Footer() {
  const t = useTranslations("Index")

  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/5 blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
              <Logo />
            </Link>
            <p className="max-w-md text-muted-foreground leading-relaxed mb-8">
              {t("footerDesc")}
            </p>
            
            {/* Social Icons (using standard icons to avoid missing brand icons) */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
                <LinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links Column */}
          <div className="md:col-span-4 lg:col-span-3 lg:col-start-7">
            <h4 className="font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t("footerLinksSection") || "Links"}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-px bg-primary transition-all group-hover:w-4" />
                  {t("footerHome")}
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-px bg-primary transition-all group-hover:w-4" />
                  {t("footerFeatures")}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-px bg-primary transition-all group-hover:w-4" />
                  {t("footerPricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {t("footerSupportSection") || "Support"}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-px bg-primary transition-all group-hover:w-4" />
                  {t("footerContact")}
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-px bg-primary transition-all group-hover:w-4" />
                  {t("footerSupport")}
                </Link>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-sm">
            {t("footerCopy")}
          </p>
          
          <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-full shadow-sm">
            <ThemeToggle />
            <div className="w-px h-5 bg-border mx-1" />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
