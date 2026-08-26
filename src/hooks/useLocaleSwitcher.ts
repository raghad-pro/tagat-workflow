"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { changeLocaleAction } from "@/i18n/locale";
import {
  LANG_COOKIE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  getDirection,
  resolveLocale,
  type Locale,
} from "@/i18n/config";

function writeCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* cookies disabled — the server action below still persists the choice */
  }
}

/**
 * The one way the app changes language.
 *
 * Both halves matter. The cookie write plus the `<html>` attributes flip the
 * page the user is looking at immediately; `router.refresh()` throws away the
 * client router cache so that pages rendered *before* the switch — a prefetched
 * `/login`, the dashboard shell — are re-fetched in the new language instead of
 * being replayed in the old one. That mismatch was why a language chosen on the
 * landing page did not survive the trip to the auth and dashboard screens.
 */
export function useLocaleSwitcher() {
  const router = useRouter();
  const locale = resolveLocale(useLocale());
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback(
    (next: Locale) => {
      const resolved = resolveLocale(next);
      if (typeof document !== "undefined") {
        writeCookie(LOCALE_COOKIE, resolved);
        writeCookie(LANG_COOKIE, resolved);
        document.documentElement.setAttribute("lang", resolved);
        document.documentElement.setAttribute("dir", getDirection(resolved));
      }

      startTransition(async () => {
        await changeLocaleAction(resolved);
        router.refresh();
      });
    },
    [router]
  );

  const toggleLocale = useCallback(
    () => setLocale(locale === "en" ? "ar" : "en"),
    [locale, setLocale]
  );

  return { locale, isRTL: locale === "ar", setLocale, toggleLocale, isPending };
}
