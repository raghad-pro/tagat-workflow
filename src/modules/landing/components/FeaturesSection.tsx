import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { FadeIn } from "@/animation/FadeIn"
import { SlideIn } from "@/animation/SlideIn"
import { Kanban, Users, BarChart2 } from "lucide-react"
import Image from "next/image"
import {companies} from '@/assets/images/images'
export function FeaturesSection() {
  const t = useTranslations("Index")

  const features = [
    {
      icon: Kanban,
      title: t("f1Title"),
      desc: t("f1Desc")
    },
    {
      icon: Users,
      title: t("f2Title"),
      desc: t("f2Desc")
    },
    {
      icon: BarChart2,
      title: t("f3Title"),
      desc: t("f3Desc")
    }
  ]

  return (
    <section className="ds-bg py-16 md:py-24" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* What is Workflow? Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-24">
          <SlideIn direction="left" className="lg:w-1/2">
            <Text tag="h2" size="xl" color="primary" className="mb-6 text-3xl md:text-4xl font-bold">
              {t.rich("featuresTitle", {
                cyan: (chunks) => <span className="text-primary">{chunks}</span>
              })}
            </Text>
            <Text size="lg" color="gray" className="leading-relaxed">
              {t("featuresDesc")}
            </Text>
          </SlideIn>
          
          <SlideIn direction="right" delay={0.2} className="lg:w-1/2 w-full">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border relative ds-bg-primary-200">
              <Image
                src={companies}
                alt="Workflow App Screenshot"
                width={1280}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </SlideIn>
        </div>

        {/* Core Features Section */}
        <FadeIn delay={0.4}>
          <div className="text-center mb-16">
            <Text tag="h3" size="xl" color="primary" className="mb-4 text-center text-3xl font-bold">
              {t.rich("coreFeaturesTitle", {
                cyan: (chunks) => <span className="text-primary">{chunks}</span>
              })}
            </Text>
            <Text color="gray" className="text-center">{t("coreFeaturesSubtitle")}</Text>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <FadeIn key={idx} delay={0.1 * idx} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 text-white hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8" />
                </div>
                <Text tag="h4" size="lg" color="primary" className="mb-3 font-bold">
                  {feature.title}
                </Text>
                <Text color="gray" className="leading-relaxed">
                  {feature.desc}
                </Text>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

      </div>
    </section>
  )
}
