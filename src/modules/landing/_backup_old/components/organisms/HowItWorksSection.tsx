"use client";

import { useTranslations } from "next-intl";
import { Monitor, UserPlus, LineChart } from "lucide-react";
import { SectionTitle } from "../atoms/SectionTitle";
import { StepCard } from "../molecules/StepCard";

export function HowItWorksSection() {
  const t = useTranslations("Index");

  const steps = [
    { num: 1, title: t("hw1Title"), desc: t("hw1Desc"), icon: Monitor },
    { num: 2, title: t("hw2Title"), desc: t("hw2Desc"), icon: UserPlus },
    { num: 3, title: t("hw3Title"), desc: t("hw3Desc"), icon: LineChart },
  ];

  return (
    <section className="py-20 md:py-32 bg-gray-50/50 dark:bg-background" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title={
            t.rich("howItWorksTitle", {
              cyan: (chunks: any) => <span className="text-primary">{chunks}</span>
            })
          }
          subtitle={t("howItWorksSubtitle")}
        />

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mt-16">
          {steps.map((step: any) => (
            <StepCard
              key={step.num}
              num={step.num}
              title={step.title}
              desc={step.desc}
              icon={step.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
