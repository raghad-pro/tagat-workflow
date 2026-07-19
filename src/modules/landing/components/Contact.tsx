'use client'

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MailIcon, GlobeIcon, PinIcon, SendIcon } from './Icons'
import Reveal from './Reveal'

export default function Contact() {
  const { t } = useApp()
  const c = t.contact
  const [status, setStatus] = useState('idle') // idle | sending | ok | error

  async function onSubmit(e: any) {
    e.preventDefault()
    const form = e.currentTarget
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('bad status')
      setStatus('ok')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="section contact">
      <div className="container contact__grid">
        <div className="contact__info">
          <Reveal as="span" className="section__label">
            {c.label}
          </Reveal>
          <Reveal as="h2" className="section__title section__title--start" delay={80}>
            {c.title}
          </Reveal>
          <Reveal as="p" delay={140}>
            {c.text}
          </Reveal>

          <Reveal className="contact__items" delay={200}>
            <a className="contact__item" href={`mailto:${c.email}`}>
              <span>
                <MailIcon size={18} />
              </span>
              {c.email}
            </a>
            <a className="contact__item" href={`https://${c.website}`} target="_blank" rel="noreferrer">
              <span>
                <GlobeIcon size={18} />
              </span>
              {c.website}
            </a>
            <div className="contact__item">
              <span>
                <PinIcon size={18} />
              </span>
              {c.location}
            </div>
          </Reveal>
        </div>

        <Reveal className="contact__card" delay={160}>
          <form onSubmit={onSubmit}>
            <label>
              {c.form.name}
              <input name="name" type="text" placeholder={c.form.namePlaceholder} required maxLength={120} />
            </label>
            <label>
              {c.form.email}
              <input name="email" type="email" placeholder={c.form.emailPlaceholder} required maxLength={190} />
            </label>
            <label>
              {c.form.message}
              <textarea name="message" rows={5} placeholder={c.form.messagePlaceholder} required maxLength={3000} />
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={status === 'sending'}>
              {status === 'sending' ? c.form.sending : c.form.submit}
              <SendIcon size={16} />
            </button>
            {status === 'ok' && <p className="contact__status contact__status--ok">{c.form.success}</p>}
            {status === 'error' && <p className="contact__status contact__status--err">{c.form.error}</p>}
          </form>
        </Reveal>
      </div>
    </section>
  )
}
