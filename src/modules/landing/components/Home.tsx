"use client";

import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import About from "./About";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import Team from "./Team";
import Plans from "./Plans";
import CTA from "./CTA";
import Contact from "./Contact";
import Footer from "./Footer";
import { AppProvider } from "../context/AppContext";

export default function Home({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <AppProvider isAuthenticated={isAuthenticated}>
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
