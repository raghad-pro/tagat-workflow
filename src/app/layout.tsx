import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo, Inter, Poppins, Tajawal } from "next/font/google";
import "./globals.css";
import AppProvider from "@/providers/AppProvider";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { getDirection, resolveLocale } from "@/i18n/config";
import { SEO_COPY, SITE_NAME, SITE_URL } from "@/config/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1118" },
  ],
};

/**
 * Site-wide defaults. The landing pages (`/`, `/ar`) add their own canonical
 * and `hreflang` links on top; everything behind sign-in is `noindex` and
 * carries no canonical at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale(await getLocale());
  const copy = SEO_COPY[locale];

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: copy.title,
      template: `%s | ${SITE_NAME}`,
    },
    description: copy.description,
    keywords: copy.keywords,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: copy.ogLocale,
      title: copy.title,
      description: copy.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = resolveLocale(await getLocale());
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = cookieStore.get("wf-theme")?.value || "light";
  const isDark = theme === "dark";

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${isDark ? "dark" : ""} ${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${inter.variable} ${poppins.variable} ${tajawal.variable}`}
      data-theme={theme}
    >
      <body suppressHydrationWarning>
      
        <AppProvider locale={locale} messages={messages}>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}