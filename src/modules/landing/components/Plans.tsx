'use client'

import dynamic from 'next/dynamic'
import { useApp } from '../context/AppContext'
import { useNearViewport, useReducedMotion } from '../hooks'
import { CheckIcon, SparkleIcon } from './Icons'
import Reveal from './Reveal'

// WebGL falling-light background — client-only lazy chunk so ogl stays out
// of the main bundle and only loads once the section is near the viewport
const Lightfall = dynamic(() => import('./Lightfall'), { ssr: false })

// Brand palette for the streaks (matches --accent / --accent-2 tones)
const LIGHTFALL_COLORS = ['#22c8e0', '#0ea5e9', '#3d7bff', '#7fe3f2']

// Light mode renders the same shader inverted + multiply-blended so the dark
// canvas disappears on white. Colors are therefore the *complements* of the
// tones we want on the page: these come out as bright cyan (#1fcbe5), teal
// (#0badc8), royal blue (#2563eb) and sky blue (#0284c7).
const LIGHTFALL_COLORS_LIGHT = ['#e0341a', '#f45237', '#da9c14', '#fd7b38']

function PlanCard({ plan, badge, featured, cta, delay }: any) {
  return (
    <Reveal className={`plan ${featured ? 'plan--featured' : ''}`} delay={delay}>
      {badge && (
        <span className={`plan__badge ${featured ? 'plan__badge--featured' : ''}`}>
          <SparkleIcon size={14} />
          {badge}
        </span>
      )}
      <div className="plan__head">
        <h3>{plan.name}</h3>
        <p>{plan.desc}</p>
      </div>
      <div className="plan__price">{plan.price}</div>
      <ul className="plan__features">
        {plan.features.map((f: any) => (
          <li key={f}>
            <span className="plan__check">
              <CheckIcon size={11} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a href="#contact" className={`btn ${featured ? 'btn--primary' : 'btn--outline'} plan__cta`}>
        {cta}
      </a>
    </Reveal>
  )
}

export default function Plans() {
  const { t, theme } = useApp()
  const p = t.plans
  const reducedMotion = useReducedMotion()
  // seen: mount the WebGL canvas only after the section approaches the
  // viewport; near: pause rendering whenever it scrolls back out of view.
  const [seenRef, seen] = useNearViewport('300px', true)
  const [nearRef, near] = useNearViewport('150px', false)

  const setRefs = (el: any) => {
    seenRef.current = el
    nearRef.current = el
  }

  const useWebGL = !reducedMotion && seen
  const dark = theme === 'dark'

  return (
    <section id="pricing" className="section plans" ref={setRefs}>
      {/* Background: the same falling-light WebGL shader in both themes.
          Light mode inverts + multiply-blends the canvas so the streaks show
          on white. CSS streaks remain as the reduced-motion fallback. */}
      <div className="plans__bg" aria-hidden="true">
        {useWebGL ? (
            <Lightfall
              key={theme}
              className={dark ? '' : 'lightfall--on-light'}
              colors={dark ? LIGHTFALL_COLORS : LIGHTFALL_COLORS_LIGHT}
              backgroundColor={dark ? '#062433' : '#200905'}
              speed={0.55}
              streakCount={3}
              streakWidth={dark ? 1 : 1.3}
              streakLength={1.15}
              glow={dark ? 0.9 : 1}
              density={0.65}
              twinkle={0.8}
              zoom={3}
              backgroundGlow={dark ? 0.35 : 0.25}
              opacity={0.7}
              mouseInteraction={false}
              paused={!near}
              dpr={0.8}
            />
        ) : (
          <div className="plans__streaks" />
        )}
      </div>

      <div className="container plans__content">
        <Reveal as="h2" className="section__title">
          {p.titleA}
          <span className="accent">{p.titleB}</span>
        </Reveal>
        <Reveal as="p" className="section__subtitle" delay={80}>
          {p.subtitle}
        </Reveal>

        <div className="plans__grid">
          <PlanCard plan={p.free} cta={p.getStarted} delay={0} />
          <PlanCard plan={p.pro} badge={p.mostPopular} featured cta={p.getStarted} delay={120} />
          <PlanCard plan={p.enterprise} badge={p.enterpriseBadge} cta={p.getStarted} delay={240} />
        </div>
      </div>
    </section>
  )
}
