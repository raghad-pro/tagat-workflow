'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { content as defaults, mergeContent } from '../i18n/content'
import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher'
import type { Locale } from '@/i18n/config'

const AppContext = createContext<any>({} as any)

function persist(key: any, value: any) {
  try {
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`
  } catch {}
}

function getCookie(key: any) {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
    return match ? match[1] : null
  } catch {
    return null
  }
}

function applyTheme(theme: any) {
  const isDark = theme === 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.toggle('dark', isDark)
}

export function AppProvider({ initialTheme, children }: any) {
  // The landing page no longer keeps its own idea of the language. It reads and
  // writes the same cookie next-intl serves the auth and dashboard screens
  // from, so a visitor who picks العربية here lands on an Arabic /login.
  const { locale, setLocale } = useLocaleSwitcher()

  const [theme, setTheme] = useState(() => {
    return getCookie('wf-theme') || initialTheme || 'light'
  })
  const [overrides, setOverrides] = useState(null)

  useEffect(() => {
    applyTheme(theme)
    persist('wf-theme', theme)
  }, [theme])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/content', { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then((r: any) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data && typeof data === 'object') setOverrides(data)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  const t = useMemo(() => {
    const key = locale as keyof typeof defaults
    const base = defaults[key] ?? defaults.en
    const over = overrides && (overrides as any)[key]
    return over ? mergeContent(base, over) : base
  }, [locale, overrides])

  const value = useMemo(
    () => ({
      theme,
      lang: locale,
      t,
      isRTL: locale === 'ar',
      toggleTheme: () => setTheme((p: any) => (p === 'dark' ? 'light' : 'dark')),
      toggleLang: () => setLocale((locale === 'en' ? 'ar' : 'en') as Locale),
    }),
    [theme, locale, t, setLocale]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
