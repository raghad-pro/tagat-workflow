import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Quote } from "lucide-react"

export function TestimonialsSection() {
  const t = useTranslations("Index")

  const testimonials = [
    { text: t("t1"), name: t("t1Name"), emoji: "👨‍💻" },
    { text: t("t2"), name: t("t2Name"), emoji: "👩‍💼" },
    { text: t("t3"), name: t("t3Name"), emoji: "👨‍🎨" }
  ]

  return (
    <section className="py-16 md:py-24 ds-bg-primary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-3xl mx-auto mb-16 text-center text-3xl font-bold">
          {t("testimonialsTitle")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testi, idx) => (
            <div key={idx} className="ds-bg p-8 rounded-2xl shadow-sm border border-border relative pt-16">
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary opacity-30" />
              
              <div className="absolute top-6 left-6 w-12 h-12 rounded-full ds-bg-gray-200 flex items-center justify-center text-2xl">
                {testi.emoji}
              </div>

              <p className="mb-8 mt-2 min-h-[80px]">
                {testi.text}
              </p>
              <p className="font-bold">
                {testi.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
