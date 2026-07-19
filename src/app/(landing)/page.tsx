"use client";

import Navbar from "@/modules/landing/components/Navbar";
import Hero from "@/modules/landing/components/Hero";
import Features from "@/modules/landing/components/Features";
import About from "@/modules/landing/components/About";
import HowItWorks from "@/modules/landing/components/HowItWorks";
import Testimonials from "@/modules/landing/components/Testimonials";
import Team from "@/modules/landing/components/Team";
import Plans from "@/modules/landing/components/Plans";
import CTA from "@/modules/landing/components/CTA";
import Contact from "@/modules/landing/components/Contact";
import Footer from "@/modules/landing/components/Footer";
import { AppProvider } from "@/modules/landing/context/AppContext";

export default function Home() {
  return (
    <AppProvider>
      <div className="landing-page-root">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <About />
          <HowItWorks />
          <Testimonials />
          <Team />
          <Plans />
          <CTA />
          <Contact />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
