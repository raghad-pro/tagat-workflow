"use client";

import { useTranslations } from "next-intl";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/animation/FadeIn";
import { SlideIn } from "@/animation/SlideIn";

export function HeroContent() {
  const t = useTranslations("Index");

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-16 lg:pt-48 lg:pb-24">
      <FadeIn>
        <Text tag="h1" size="xl" className="max-w-4xl mx-auto mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl font-bold">
          {t.rich("heroTitle", {
            cyan: (chunks) => <span className="text-primary">{chunks}</span>
          })}
        </Text>
      </FadeIn>
      
      <SlideIn delay={0.2} direction="right">
        <Text size="lg" color="gray" className="max-w-2xl mx-auto mb-10 text-center">
          {t("heroSubtitle")}
        </Text>
      </SlideIn>
      
      <FadeIn delay={0.4}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">{t("heroCta")}</Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 bg-background/50 backdrop-blur-sm border-primary/20">{t("heroVideo")}</Button>
        </div>
      </FadeIn>
      

    </div>
  );
}
