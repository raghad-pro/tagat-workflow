/**
 * The single source of truth for language across the whole app — landing page,
 * auth screens and dashboard all read the same cookie through here, so a
 * language picked on the landing page is the one every later screen renders in.
 */
export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Read by `src/i18n/request.ts` on the server and by the switcher on the client. */
export const LOCALE_COOKIE = "locale";

/** Kept in step with `LOCALE_COOKIE` for the landing page's own persistence. */
export const LANG_COOKIE = "wf-lang";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Anything unrecognised (a stale or hand-edited cookie) falls back to English. */
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDirection(locale: unknown): "rtl" | "ltr" {
  return resolveLocale(locale) === "ar" ? "rtl" : "ltr";
}

export function isRTL(locale: unknown): boolean {
  return getDirection(locale) === "rtl";
}
