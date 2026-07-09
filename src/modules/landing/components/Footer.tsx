import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import Link from "next/link"
import Logo from "@/components/atoms/Logo"
import ThemeToggle from "@/components/atoms/ThemeButton"
import LanguageSwitcher from "@/components/atoms/languageSwitcher"

export function Footer() {
  const t = useTranslations("Index")

  const footerSections = [
    {
      
      title: "Links",
      links: [
        { label: t("footerHome"), href: "/" },
        { label: t("footerFeatures"), href: "#features" },
        { label: t("footerPricing"), href: "#pricing" }
      ]
    },
    {
      title: "Contact",
      links: [
        { label: t("footerContact"), href: "#contact" },
        { label: t("footerSupport"), href: "#contact" }
      ]
    }
  ]

  return (
    <footer className="ds-bg pt-16 pb-8 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Logo />
            </Link>
            <Text color="gray" className="max-w-xs mb-6">
              {t("footerDesc")}
            </Text>
            <div className="flex gap-4 items-center">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
          
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <Text tag="h4" color="primary" className="font-semibold mb-6 uppercase tracking-wider text-sm">
                {section.title}
              </Text>
              <ul className="space-y-4">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link href={link.href} className="ds-text-gray hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
        
        <div className="pt-8 border-t border-border text-center">
          <Text size="sm" color="gray">
            {t("footerCopy")}
          </Text>
        </div>
      </div>
    </footer>
  )
}
