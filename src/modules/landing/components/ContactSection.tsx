import { useTranslations } from "next-intl"
import { Text } from "@/components/atoms/Text"
import { Button } from "@/components/atoms/Button"
import { FadeIn } from "@/animation/FadeIn"
import { SlideIn } from "@/animation/SlideIn"
import { Mail, Globe, MapPin, Check } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ContactSection() {
  const t = useTranslations("Index")

  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-primary" id="contact">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Form Side */}
          <SlideIn direction="left" className="w-full lg:w-1/2">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
              <form className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-white px-1">{t("formName")}</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white rounded-xl"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white px-1">{t("formEmail")}</Label>
                  <Input 
                    type="email" 
                    id="email" 
                    className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="message" className="text-white px-1">{t("formMessage")}</Label>
                  <Textarea 
                    id="message" 
                    rows={5}
                    className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white rounded-xl resize-none"
                  />
                </div>

                <Button variant="solid" className="mt-4 gap-2 h-14 rounded-xl text-lg w-full shadow-lg shadow-black/10">
                  <Check className="w-5 h-5" />
                  {t("formSubmit")}
                </Button>
              </form>
            </div>
          </SlideIn>

          <SlideIn direction="right" delay={0.2} className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="text-blue-50 font-bold tracking-wider mb-2 flex items-center gap-2">
              <span className="w-8 h-1 bg-white rounded-full"></span>
              {t("contactTag")}
            </div>
            
            <Text tag="h2" size="xl" className="text-white mb-12 text-4xl md:text-5xl font-bold">
              {t("contactTitle")}
            </Text>

            <div className="flex flex-col gap-10">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <Text className="text-blue-100 mb-1 text-sm">{t("contactEmail")}</Text>
                  <Text className="text-white font-medium text-lg">support@workflownets.com</Text>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all shadow-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <Text className="text-blue-100 mb-1 text-sm">{t("contactWebsite")}</Text>
                  <Text className="text-white font-medium text-lg">www.workflow.com</Text>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <Text className="text-blue-100 mb-1 text-sm">{t("contactLocation")}</Text>
                  <Text className="text-white font-medium text-lg">{t("locationText")}</Text>
                </div>
              </div>
            </div>
          </SlideIn>

        </div>
      </div>
    </section>
  )
}
