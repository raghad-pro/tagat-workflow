"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        success: {
          style: {
            background: "#1d9e75",
            color: "#fff",
          },
        },
        error: {
          style: {
            background: "#F92929",
            color: "#fff",
          },
        },
      }}
    />
  );
}