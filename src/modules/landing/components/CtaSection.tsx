import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const t = useTranslations("Index")

  return (
    <section className="bg-primary py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="mb-6 text-center text-3xl md:text-4xl font-bold text-white">
          {t("ctaTitle")}
        </h2>
        <p className="mb-10 max-w-2xl mx-auto text-center text-white/90">
          {t("ctaSubtitle")}
        </p>
        <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/10">
          {t("ctaBtn")}
        </Button>
      </div>
    </section>
  )
}
