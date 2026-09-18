import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, LOCALE_HEADER, resolveLocale } from './config';

export default getRequestConfig(async () => {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  // The public landing page is addressed by URL (`/` is English, `/ar` is
  // Arabic) so each language has its own indexable page; the middleware pins
  // that choice in a header. Everywhere else the language is the cookie.
  // Both are guarded: the cookie is written from the client, so an unknown
  // value must not reach the dynamic import below.
  const locale = resolveLocale(
    headerStore.get(LOCALE_HEADER) ?? cookieStore.get(LOCALE_COOKIE)?.value
  );
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
