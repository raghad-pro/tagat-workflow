import type { Metadata } from "next";
import { LANDING_PATHS, type Locale } from "@/i18n/config";
import { SEO_COPY } from "@/config/seo";

/**
 * Per-language metadata for the landing page: its own canonical, and
 * `hreflang` links pointing every language at the other, with English as the
 * default for anyone the engine cannot place.
 */
export function landingMetadata(locale: Locale): Metadata {
  const copy = SEO_COPY[locale];
  const path = LANDING_PATHS[locale];

  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: path,
      languages: {
        en: LANDING_PATHS.en,
        ar: LANDING_PATHS.ar,
        "x-default": LANDING_PATHS.en,
      },
    },
    openGraph: {
      url: path,
      locale: copy.ogLocale,
      alternateLocale: locale === "en" ? [SEO_COPY.ar.ogLocale] : [SEO_COPY.en.ogLocale],
      title: copy.title,
      description: copy.description,
    },
    twitter: { title: copy.title, description: copy.description },
  };
}
