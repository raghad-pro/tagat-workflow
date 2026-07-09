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
    <section className="py-16 md:py-24 relative overflow-hidden bg-primary/5 dark:bg-primary/5" id="contact">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Form Side */}
          <SlideIn direction="left" className="w-full lg:w-1/2">
            <div className="bg-background border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
              
              <form className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-foreground px-1 font-medium">{t("formName")}</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    className="h-12 bg-background ds-border-form text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl transition-all shadow-sm"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-foreground px-1 font-medium">{t("formEmail")}</Label>
                  <Input 
                    type="email" 
                    id="email" 
                    className="h-12 bg-background ds-border-form text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="message" className="text-foreground px-1 font-medium">{t("formMessage")}</Label>
                  <Textarea 
                    id="message" 
                    rows={5}
                    className="min-h-[120px] bg-background ds-border-form text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl resize-none transition-all shadow-sm"
                  />
                </div>

                <Button variant="solid" className="mt-2 gap-2 h-14 rounded-xl text-lg w-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Check className="w-5 h-5" />
                  {t("formSubmit")}
                </Button>
              </form>
            </div>
          </SlideIn>

          {/* Text & Info Side */}
          <SlideIn direction="right" delay={0.2} className="w-full lg:w-1/2 flex flex-col justify-center">
            <div className="text-primary font-bold tracking-wider mb-2 flex items-center gap-2">
              <span className="w-8 h-1 bg-primary rounded-full"></span>
              {t("contactTag")}
            </div>
            
            <h2 className="text-foreground mb-12 text-4xl md:text-5xl font-bold">
              {t("contactTitle")}
            </h2>

            <div className="flex flex-col gap-10">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">{t("contactEmail")}</p>
                  <p className="text-foreground font-medium text-lg">support@workflownets.com</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">{t("contactWebsite")}</p>
                  <p className="text-foreground font-medium text-lg">www.workflow.com</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">{t("contactLocation")}</p>
                  <p className="text-foreground font-medium text-lg">{t("locationText")}</p>
                </div>
              </div>
            </div>
          </SlideIn>

        </div>
      </div>
    </section>
  )
}
