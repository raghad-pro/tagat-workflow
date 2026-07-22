'use client'

import { useApp } from '../context/AppContext'
import Reveal from './Reveal'

export default function About() {
  const { t, theme } = useApp()

  return (
    <section id="about" className="section about">
      <div className="about__glow" />
      <div className="container about__grid">
        <div className="about__text">
          <Reveal as="span" className="section__label">
            {t.about.label}
          </Reveal>
          <Reveal as="h2" className="section__title section__title--start" delay={80}>
            {t.about.titleA}
            <span className="accent">{t.about.titleB}</span>
          </Reveal>
          <Reveal as="p" delay={160}>
            {t.about.text}
          </Reveal>
        </div>
        <Reveal className="about__visual" delay={200}>
          <div className="about__mock about__mock--back">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard.png"
              alt="Dashboard"
              className="about__dashboard-img"
            />
          </div>
          <div className="about__mock about__mock--front">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dashboard.png"
              alt="Dashboard"
              className="about__dashboard-img"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
