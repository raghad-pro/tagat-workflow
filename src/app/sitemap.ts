import type { MetadataRoute } from "next";
import { LANDING_PATHS } from "@/i18n/config";
import { SITE_URL } from "@/config/seo";

const absolute = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    en: absolute(LANDING_PATHS.en),
    ar: absolute(LANDING_PATHS.ar),
    "x-default": absolute(LANDING_PATHS.en),
  };

  return Object.values(LANDING_PATHS).map((path) => ({
    url: absolute(path),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
    alternates: { languages },
  }));
}
