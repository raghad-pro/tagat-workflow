'use client'

import { useApp } from '../context/AppContext'
import { MailIcon, GlobeIcon, LinkedinIcon, PinIcon } from './Icons'

export default function Footer() {
  const { t, theme } = useApp()
  const f = t.footer
  const hrefs = ['#home', '#features', '#pricing', '#contact', '#contact']

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <a href="#home" className="footer__logo-link" aria-label="Workflow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme === 'dark' ? '/logoDark.png' : '/logoLight.png'}
                alt="Workflow"
                className="footer__logo-img"
              />
            </a>
            <p>{f.text}</p>
            <div className="footer__socials">
              <a href="mailto:support@workflownets.com" aria-label="Email">
                <MailIcon size={16} />
              </a>
              <a href={`https://${t.contact.website}`} target="_blank" rel="noreferrer" aria-label="Website">
                <GlobeIcon size={16} />
              </a>
              <a href="https://www.linkedin.com/company/workflow-site" target="_blank" rel="noreferrer" aria-label="LinkedIn">
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
            <a href="mailto:support@workflownets.com">
              <MailIcon size={15} /> support@workflownets.com
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
