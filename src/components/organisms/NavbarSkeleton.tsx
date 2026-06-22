"use client";

import React from "react";

export function NavbarSkeleton() {
  return (
    <header
      className="sticky top-0 z-40 w-full flex items-center justify-between px-4 sm:px-6 ds-navbar"
      style={{
        height: "var(--navbar-height)",
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      <div className="flex-1 flex items-center gap-4">
        {/* Mobile menu toggle placeholder */}
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse md:hidden" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme & Lang switcher placeholders */}
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse hidden sm:block" />
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse hidden sm:block" />
        
        {/* Bell placeholder */}
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />

        {/* Divider */}
        <div className="hidden sm:block w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

        {/* User profile placeholder */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
          <div className="hidden sm:flex flex-col gap-1.5 w-24">
            <div className="w-full h-3.5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
            <div className="w-2/3 h-2.5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </header>
  );
}
