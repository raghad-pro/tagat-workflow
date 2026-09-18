'use client'

import Link from 'next/link'
import { useApp } from '../context/AppContext'
import { ArrowIcon } from './Icons'
import Reveal from './Reveal'

export default function CTA() {
  const { t, isRTL, isAuthenticated } = useApp()

  return (
    <section className="section cta-section">
      <div className="container">
        <Reveal className="cta">
          <h2>{t.cta.title}</h2>
          <p>{t.cta.subtitle}</p>
          <Link href={isAuthenticated ? "/dashboard" : "/register"} className="btn btn--white">
            {isAuthenticated ? t.nav.goToDashboard : t.cta.button}
            <ArrowIcon flip={isRTL} size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
