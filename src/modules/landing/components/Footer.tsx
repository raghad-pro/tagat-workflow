'use client'

import { useApp } from '../context/AppContext'
import { MailIcon, GlobeIcon, LinkedinIcon, PinIcon } from './Icons'

export default function Footer() {
  const { t } = useApp()
  const f = t.footer
  const hrefs = ['#home', '#features', '#pricing', '#contact', '#contact']

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              {f.logoA}
              <span>{f.logoB}</span>
            </div>
            <p>{f.text}</p>
            <div className="footer__socials">
              <a href={`mailto:${t.contact.email}`} aria-label="Email">
                <MailIcon size={16} />
              </a>
              <a href={`https://${t.contact.website}`} target="_blank" rel="noreferrer" aria-label="Website">
                <GlobeIcon size={16} />
              </a>
              <a href="#contact" aria-label="LinkedIn">
                <LinkedinIcon size={16} />
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4>{f.navTitle}</h4>
            {f.navLinks.map((label: any, i: any) => (
              <a key={label} href={hrefs[i]}>
                {label}
              </a>
            ))}
          </div>

          <div className="footer__col">
            <h4>{f.contactTitle}</h4>
            <a href={`mailto:${t.contact.email}`}>
              <MailIcon size={15} /> {t.contact.email}
            </a>
            <a href={`https://${t.contact.website}`} target="_blank" rel="noreferrer">
              <GlobeIcon size={15} /> {t.contact.website}
            </a>
            <span className="footer__plain">
              <PinIcon size={15} /> {t.contact.location}
            </span>
          </div>
        </div>

        <div className="footer__bottom">
          <span>{f.rights}</span>
          <div>
            <a href="#home">{f.privacy}</a>
            <a href="#home">{f.terms}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
