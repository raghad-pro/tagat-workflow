'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { content as defaults, mergeContent } from '../i18n/content'

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

export function AppProvider({ initialTheme, initialLang = 'en', children }: any) {
  const [theme, setTheme] = useState(() => {
    return getCookie('wf-theme') || initialTheme || 'light'
  })
  const [lang, setLang] = useState(initialLang)
  const [overrides, setOverrides] = useState(null)

  useEffect(() => {
    applyTheme(theme)
    persist('wf-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    persist('wf-lang', lang)
  }, [lang])

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
    const key = lang as keyof typeof defaults;
    const base = defaults[key];
    const over = overrides && (overrides as any)[key];
    return over ? mergeContent(base, over) : base;
  }, [lang, overrides])

  const value = useMemo(
    () => ({
      theme,
      lang,
      t,
      isRTL: lang === 'ar',
      toggleTheme: () => setTheme((p: any) => (p === 'dark' ? 'light' : 'dark')),
      toggleLang: () => setLang((p: any) => (p === 'en' ? 'ar' : 'en')),
    }),
    [theme, lang, t]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
