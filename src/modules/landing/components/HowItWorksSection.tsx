import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Monitor, UserPlus, LineChart } from "lucide-react"

export function HowItWorksSection() {
  const t = useTranslations("Index")

  const steps = [
    { num: 1, title: t("hw1Title"), desc: t("hw1Desc"), icon: Monitor },
    { num: 2, title: t("hw2Title"), desc: t("hw2Desc"), icon: UserPlus },
    { num: 3, title: t("hw3Title"), desc: t("hw3Desc"), icon: LineChart },
  ]

  return (
    <section className="py-16 md:py-24 ds-bg-primary-200" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <Text tag="h2" size="xl" className="mb-4 text-center text-3xl font-bold">
            {t.rich("howItWorksTitle", {
              cyan: (chunks) => <span className="text-primary">{chunks}</span>
            })}
          </Text>
          <Text color="gray" className="text-center">{t("howItWorksSubtitle")}</Text>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative ds-bg px-8 pt-12 pb-8 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center mt-6 md:mt-0">
              
              {/* Number Badge overlapping the top border */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 text-primary border-4 border-border flex items-center justify-center font-bold">
                {step.num}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md shadow-primary/30">
                <step.icon className="w-8 h-8" />
              </div>
              
              <Text tag="h3" size="lg" className="mb-4 font-bold text-xl">
                {step.title}
              </Text>
              <Text color="gray">{step.desc}</Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
