'use client'

import { useApp } from '../context/AppContext'
import { BoltIcon, UsersIcon, ChartIcon } from './Icons'
import Reveal from './Reveal'

const icons = [BoltIcon, UsersIcon, ChartIcon]

export default function Features() {
  const { t } = useApp()

  return (
    <section id="features" className="section features">
      <div className="container">
        <Reveal as="h2" className="section__title">
          {t.features.titleA}
          <span className="accent">{t.features.titleB}</span>
        </Reveal>
        <Reveal as="p" className="section__subtitle" delay={80}>
          {t.features.subtitle}
        </Reveal>

        <div className="features__grid">
          {t.features.items.map((item: any, i: any) => {
            const Ico = icons[i]
            return (
              <Reveal key={item.title} className="feature-card" delay={i * 120}>
                <div className="feature-card__top">
                  <span className="feature-card__icon">
                    <Ico size={22} />
                  </span>
                  <span className="feature-card__num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
