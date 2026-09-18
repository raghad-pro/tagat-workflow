'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { content as defaults } from '../i18n/content'
import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher'
import { landingPathFor, type Locale } from '@/i18n/config'

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

interface AppProviderProps {
  initialTheme?: string
  /**
   * Decided on the server from the session cookie, so the page renders the
   * right call to action on the first paint instead of flashing "Get Started"
   * at someone who is already signed in.
   */
  isAuthenticated?: boolean
  children: React.ReactNode
}

export function AppProvider({ initialTheme, isAuthenticated = false, children }: AppProviderProps) {
  // The landing page no longer keeps its own idea of the language. It reads and
  // writes the same cookie next-intl serves the auth and dashboard screens
  // from, so a visitor who picks العربية here lands on an Arabic /login.
  const { locale, setLocale } = useLocaleSwitcher()
  const router = useRouter()

  const [theme, setTheme] = useState(() => {
    return getCookie('wf-theme') || initialTheme || 'light'
  })
  useEffect(() => {
    applyTheme(theme)
    persist('wf-theme', theme)
  }, [theme])

  const t = useMemo(() => {
    const key = locale as keyof typeof defaults
    return defaults[key] ?? defaults.en
  }, [locale])

  const value = useMemo(
    () => ({
      theme,
      lang: locale,
      t,
      isRTL: locale === 'ar',
      isAuthenticated,
      toggleTheme: () => setTheme((p: any) => (p === 'dark' ? 'light' : 'dark')),
      // Each language of the landing page has its own URL, so switching moves
      // there as well as writing the cookie the rest of the app reads.
      toggleLang: () => {
        const next = (locale === 'en' ? 'ar' : 'en') as Locale
        setLocale(next)
        router.replace(landingPathFor(next))
      },
    }),
    [theme, locale, t, isAuthenticated, setLocale, router]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
