import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, resolveLocale } from './config';

export default getRequestConfig(async () => {
  const store = await cookies();
  // Guard the cookie: it is written from the client (landing page + switcher),
  // so an unknown value must not reach the dynamic import below.
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
