import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProvider from "@/providers/AppProvider";
import { getLocale, getMessages } from "next-intl/server";
import Navbar from "@/components/organisms/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

  return (
    <html
      lang={locale}
      dir={locale === "en" ?  "ltr":"rtl"}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
      
        <AppProvider locale={locale} messages={messages}>
          {/* <Navbar />  */}
          {children}
        </AppProvider>
      </body>
    </html>
  );
}