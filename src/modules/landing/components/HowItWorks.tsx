'use client'

import { useApp } from '../context/AppContext'
import { FolderPlusIcon, UserPlusIcon, TrendIcon } from './Icons'
import Reveal from './Reveal'

const icons = [FolderPlusIcon, UserPlusIcon, TrendIcon]

export default function HowItWorks() {
  const { t } = useApp()

  return (
    <section id="how" className="section how">
      <div className="how__glow" />
      <div className="container">
        <Reveal as="h2" className="section__title">
          {t.how.titleA}
          <span className="accent">{t.how.titleB}</span>
        </Reveal>
        <Reveal as="p" className="section__subtitle" delay={80}>
          {t.how.subtitle}
        </Reveal>

        <div className="how__grid">
          {t.how.steps.map((step: any, i: any) => {
            const Ico = icons[i]
            return (
              <Reveal key={step.title} className="how-card" delay={i * 120}>
                <span className="how-card__step">{i + 1}</span>
                <span className="how-card__icon">
                  <Ico size={26} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
