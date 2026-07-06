import { Navbar } from "@/modules/landing/components/organisms/Navbar"
import { HeroSection } from "@/modules/landing/components/organisms/HeroSection"
import { FeaturesSection } from "@/modules/landing/components/FeaturesSection"
import { HowItWorksSection } from "@/modules/landing/components/organisms/HowItWorksSection"
import { TeamSection } from "@/modules/landing/components/TeamSection"
import { TestimonialsSection } from "@/modules/landing/components/TestimonialsSection"
import { PricingSection } from "@/modules/landing/components/PricingSection"
import { CtaSection } from "@/modules/landing/components/CtaSection"
import { ContactSection } from "@/modules/landing/components/ContactSection"
import { Footer } from "@/modules/landing/components/Footer"
// import { ScrollToTop } from "@/components/molecules/ScrollToTop"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen ds-bg-background ds-text-foreground">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TeamSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
        <ContactSection />
      </main>
      <Footer />
      {/* <ScrollToTop /> */}
    </div>
  )
}
