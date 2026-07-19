'use client'

import dynamic from 'next/dynamic'
import { useApp } from '../context/AppContext'
import { useReducedMotion } from '../hooks'
import { MailIcon, PhoneIcon, LinkedinIcon, UserSilhouetteIcon } from './Icons'
import Reveal from './Reveal'

// WebGL ray background (dark mode only) — client-only lazy chunk so ogl
// stays out of the main bundle and never runs during SSR
const SideRays = dynamic(() => import('./SideRays'), { ssr: false })

// Team members rendered 4 per row (grid wraps automatically).
// Photos are placeholders — set `photo` per member from the Laravel dashboard
// (or in i18n/content.js) when ready.
export default function Team() {
  const { t, theme } = useApp()
  const reducedMotion = useReducedMotion()

  return (
    <section id="team" className="section team">
      {/* Background: animated light rays from the top-right corner.
          Dark mode uses the WebGL SideRays shader; light mode uses soft
          CSS beams with the same origin/idea (and as reduced-motion fallback). */}
      <div className="team__bg" aria-hidden="true">
        {theme === 'dark' && !reducedMotion ? (
          <SideRays
            speed={1.6}
            rayColor1="#22c8e0"
            rayColor2="#3d7bff"
            intensity={1.5}
            spread={1.6}
            origin="top-right"
            tilt={0}
            saturation={1.3}
            blend={0.6}
            falloff={1.7}
            opacity={0.85}
          />
        ) : (
          <div className="team__rays" />
        )}
      </div>

      <div className="container team__content">
        <Reveal as="span" className="section__label section__label--center">
          {t.team.label}
        </Reveal>
        <Reveal as="h2" className="section__title" delay={80}>
          {t.team.titleA}
          <span className="accent">{t.team.titleB}</span>
        </Reveal>

        <div className="team__grid">
          {t.team.members.slice(0, 8).map((m: any, i: any) => (
            <Reveal key={`${m.name}-${i}`} className="team-card" delay={(i % 4) * 90}>
              <div className="team-card__photo">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} loading="lazy" width="96" height="96" />
                ) : (
                  <UserSilhouetteIcon size={44} />
                )}
              </div>
              <h3>{m.name}</h3>
              <p>{m.role}</p>
              <div className="team-card__links">
                <a href={m.email ? `mailto:${m.email}` : '#team'} aria-label={`Email ${m.name}`}>
                  <MailIcon size={16} />
                </a>
                <a
                  href={m.phone ? (m.phone.startsWith('http') ? m.phone : `tel:${m.phone}`) : '#team'}
                  aria-label={`Call ${m.name}`}
                  {...(m.phone && m.phone.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <PhoneIcon size={16} />
                </a>
                <a
                  href={m.linkedin || '#team'}
                  aria-label={`${m.name} on LinkedIn`}
                  {...(m.linkedin ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <LinkedinIcon size={16} />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
