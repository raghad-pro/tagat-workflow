"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/animation/FadeIn";
import { SlideIn } from "@/animation/SlideIn";
import { ScaleIn } from "@/animation/ScaleIn";
import Image from "next/image";
import { dashboardImage } from "@/assets/images/images";

export function HeroContent() {
  const t = useTranslations("Index");

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-16 lg:pt-48 lg:pb-24">
      <FadeIn>
        <h1 className="max-w-4xl mx-auto mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
          {t.rich("heroTitle", {
            cyan: (chunks) => <span className="text-primary">{chunks}</span>
          })}
        </h1>
      </FadeIn>
      
      <SlideIn delay={0.2} direction="right">
        <p className="max-w-2xl mx-auto mb-10 text-center text-lg text-muted-foreground ds-text-gray">
          {t("heroSubtitle")}
        </p>
      </SlideIn>
      
      <FadeIn delay={0.4}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">{t("heroCta")}</Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 bg-background/50 backdrop-blur-sm border-primary/20">{t("heroVideo")}</Button>
        </div>
      </FadeIn>
      
      <ScaleIn delay={0.6}>
        <div className="mt-16 relative max-w-5xl mx-auto">
          {/* Dashboard floating mockup effect */}
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 ds-bg flex items-center justify-center relative transform transition-transform duration-700 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
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
  );
}
