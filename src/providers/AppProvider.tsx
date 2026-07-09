"use client";

import ReactQueryProvider from "./ReactQueryProvider"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";
import { ThemeProvider } from "./ThemeProvider";
import { NextIntlClientProvider,AbstractIntlMessages} from "next-intl";

export default function AppProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReactQueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ReactQueryProvider>
    </NextIntlClientProvider>
  );
}