"use server";

import { cookies } from "next/headers";
import {
  LANG_COOKIE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  resolveLocale,
} from "./config";

/**
 * Persists the chosen language server-side so the very next request — including
 * the RSC payload for a page the router has not rendered yet — is produced in
 * it. Writing the cookie only from `document.cookie` left server components
 * (the `<html dir>` attribute, every `getTranslations` call) a step behind.
 */
export async function changeLocaleAction(locale: string) {
  const resolved = resolveLocale(locale);
  const store = await cookies();
  const options = {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  } as const;

  store.set(LOCALE_COOKIE, resolved, options);
  // The landing page reads `wf-lang`; keep the two from drifting apart.
  store.set(LANG_COOKIE, resolved, options);

  return resolved;
}
