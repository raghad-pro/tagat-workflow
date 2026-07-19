'use client'

import { useApp } from '../context/AppContext'
import { QuoteIcon } from './Icons'
import Reveal from './Reveal'

export default function Testimonials() {
  const { t } = useApp()

  return (
    <section id="testimonials" className="section testimonials">
      <div className="testimonials__glow" />
      <div className="container">
        <Reveal as="h2" className="section__title">
          {t.testimonials.titleA}
          <br />
          {t.testimonials.titleB}
          <span className="accent">{t.testimonials.titleHighlight}</span>
          {t.testimonials.titleC}
        </Reveal>

        <div className="testimonials__grid">
          {t.testimonials.items.map((item: any, i: any) => (
            <Reveal key={item.name} className="quote-card" delay={i * 120}>
              <div className="quote-card__top">
                <span className="quote-card__avatar">{item.emoji}</span>
                <QuoteIcon className="quote-card__mark" />
              </div>
              <p>{item.quote}</p>
              <hr />
              <b>{item.name}</b>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
