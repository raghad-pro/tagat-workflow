'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { MoonIcon, SunIcon, LangIcon } from './Icons'

export default function Navbar() {
  const { t, theme, lang, toggleTheme, toggleLang } = useApp()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string>('#home')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#home', label: t.nav.home },
    { href: '#about', label: t.nav.about },
    { href: '#features', label: t.nav.features },
    { href: '#pricing', label: t.nav.pricing },
    { href: '#contact', label: t.nav.contact },
  ]

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#home" className="nav__logo" aria-label="Workflow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme === 'dark' ? '/logoDark.png' : '/logoLight.png'}
            alt="Workflow"
            className="nav__logo-img"
          />
        </a>

        <nav className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="Main" onMouseLeave={() => setHoveredLink('#home')}>
          {links.map((l, i) => {
            const isHovered = hoveredLink === l.href
            return (
              <a 
                key={l.href} 
                href={l.href} 
                className={isHovered ? 'active' : ''} 
                onClick={() => setOpen(false)}
                onMouseEnter={() => setHoveredLink(l.href)}
                style={{ position: 'relative' }}
              >
                {isHovered && (
                  <motion.div
                    layoutId="nav-pill"
                    className="nav__pill-bg"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="nav__link-text">{l.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="nav__right-group">
          <div className="nav__actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="icon-btn icon-btn--lang"
              onClick={toggleLang}
              aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
              title={lang === 'en' ? 'العربية' : 'English'}
            >
              <LangIcon />
              <span>{lang === 'en' ? 'ع' : 'EN'}</span>
            </button>
            <Link href="/register" className="btn btn--primary nav__cta">
              {t.nav.getStarted}
            </Link>
          </div>

          <button
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v: any) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
