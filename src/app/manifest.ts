import type { MetadataRoute } from "next";
import { SEO_COPY, SITE_NAME } from "@/config/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SEO_COPY.en.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#25C6DA",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
