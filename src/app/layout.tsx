import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo, Inter, Poppins, Tajawal } from "next/font/google";
import "./globals.css";
import AppProvider from "@/providers/AppProvider";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";

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

export const metadata: Metadata = {
  title: "Workflow",
  description: "منصة إدارة المشاريع والفرق",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = cookieStore.get("wf-theme")?.value || "light";
  const isDark = theme === "dark";

  return (
    <html
      lang={locale}
      dir={locale === "en" ?  "ltr":"rtl"}
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