"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-bg-form)",
          color: "var(--color-text-main)",
          border: "1px solid var(--color-primary)",
          boxShadow: "0 10px 40px -10px rgba(18,194,233,0.25)",
          borderRadius: "16px",
          padding: "16px 24px",
          fontWeight: "600",
          fontSize: "15px",
        },
        success: {
          style: {
            background: "#1d9e75",
            color: "#fff",
            border: "none",
            boxShadow: "0 10px 40px -10px rgba(29,158,117,0.4)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#1d9e75",
          },
        },
        error: {
          style: {
            background: "#F92929",
            color: "#fff",
            border: "none",
            boxShadow: "0 10px 40px -10px rgba(249,41,41,0.4)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#F92929",
          },
        },
      }}
    />
  );
}