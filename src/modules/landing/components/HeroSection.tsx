import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/animation/FadeIn"
import { SlideIn } from "@/animation/SlideIn"
import { ScaleIn } from "@/animation/ScaleIn"
import Image from "next/image"
import { dashboardImage } from "@/assets/images/images"
export function HeroSection() {
  const t = useTranslations("Index")

  return (
    <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h1 className="max-w-4xl mx-auto mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl font-bold">
            {t.rich("heroTitle", {
              cyan: (chunks) => <span className="text-primary">{chunks}</span>
            })}
          </h1>
        </FadeIn>
        
        <SlideIn delay={0.2} direction="right">
          <p className="max-w-2xl mx-auto mb-10 text-center">
            {t("heroSubtitle")}
          </p>
        </SlideIn>
        
        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">{t("heroCta")}</Button>
            <Button size="lg" variant="outline">{t("heroVideo")}</Button>
          </div>
        </FadeIn>
        
        <ScaleIn delay={0.6}>
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border ds-bg flex items-center justify-center relative">
              <Image
                src={dashboardImage}
                alt="Workflow Dashboard"
                width={1280}
                height={800}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </ScaleIn>
      </div>
    </section>
  )
}
