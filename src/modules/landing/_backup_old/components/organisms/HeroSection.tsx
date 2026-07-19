"use client";

import { HeroBackground } from "../atoms/HeroBackground";
import { HeroContent } from "../molecules/HeroContent";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden w-full min-h-screen flex flex-col justify-center">
      <HeroBackground />
      <HeroContent />
    </section>
  );
}
