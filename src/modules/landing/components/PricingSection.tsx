import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/animation/FadeIn"
import { Check } from "lucide-react"

export function PricingSection() {
  const t = useTranslations("Index")

  const plans = [
    {
      name: t("freePlan"),
      desc: t("freeDesc"),
      price: t("freePrice"),
      features: [t("freeF1"), t("freeF2"), t("freeF3"), t("freeF4"), t("freeF5")],
      popular: false,
    },
    {
      name: t("proPlan"),
      desc: t("proDesc"),
      price: t("proPrice"),
      features: [t("proF1"), t("proF2"), t("proF3"), t("proF4"), t("proF5")],
      popular: true,
    },
    {
      name: t("entPlan"),
      desc: t("entDesc"),
      price: t("entPrice"),
      features: [t("entF1"), t("entF2"), t("entF3"), t("entF4"), t("entF5")],
      popular: false,
    },
  ]

  return (
    <section className="py-16 md:py-24 ds-bg-primary-200" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <Text tag="h2" size="xl" className="mb-4 text-center text-3xl font-bold">
              {t("pricingTitle")}
            </Text>
            <Text color="gray" className="text-center">{t("pricingSubtitle")}</Text>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <FadeIn key={idx} delay={0.2 * idx}>
              <div className={`relative flex flex-col h-full p-8 lg:p-10 rounded-3xl border ds-bg shadow-sm transition-transform hover:-translate-y-1 ${plan.popular ? 'border-primary shadow-xl dark:shadow-primary/10' : 'border-border'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      {t("mostPopular")}
                    </span>
                  </div>
                )}
                
                <div className="mb-8 mt-4 text-center">
                  <Text tag="h3" size="lg" className="mb-2 font-bold">{plan.name}</Text>
                  <Text color="gray" size="sm" className="text-center">{plan.desc}</Text>
                </div>
                
                <div className="mb-8 flex items-baseline justify-center gap-2 text-center">
                  <span className="text-4xl lg:text-5xl font-extrabold">{plan.price}</span>
                </div>
                
                <ul className="space-y-5 mb-10 flex-grow w-fit mx-auto">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full h-12 md:h-14 text-base font-bold mt-auto"
                >
                  {t("getStarted")}
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
