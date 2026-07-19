'use client'

import Link from 'next/link'
import { useApp } from '../context/AppContext'
import { ArrowIcon } from './Icons'
import WorldMapBg from './WorldMapBg'
import Reveal from './Reveal'

export default function Hero() {
  const { t, isRTL } = useApp()

  return (
    <section id="home" className="hero">
      <div className="hero__glow hero__glow--1" />
      <div className="hero__glow hero__glow--2" />
      <div className="hero__glow hero__glow--3" />
      <div className="hero__map">
        <WorldMapBg />
      </div>

      <div className="container hero__content">
        <Reveal as="h1" className="hero__title">
          {t.hero.titleA}
          <span className="grad">{t.hero.titleHighlightA}</span>
          <br />
          {t.hero.titleB}
          <span className="grad">{t.hero.titleHighlightB}</span>
        </Reveal>

        <Reveal as="p" className="hero__subtitle" delay={120}>
          {t.hero.subtitle}
        </Reveal>

        <Reveal className="hero__actions" delay={220}>
          <Link href="/register" className="btn btn--primary btn--lg">
            {t.hero.ctaPrimary}
            <ArrowIcon flip={isRTL} size={18} />
          </Link>
          <a href="#pricing" className="btn btn--ghost btn--lg">
            {t.hero.ctaSecondary}
          </a>
        </Reveal>

        <Reveal className="hero__mock" delay={320}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dashboard.png" alt="Dashboard" className="hero__dashboard-img" />
        </Reveal>
      </div>
    </section>
  )
}
