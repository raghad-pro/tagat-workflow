"use client";

import { useState, useRef, useEffect } from "react";
import ThemeButton from "@/components/atoms/ThemeButton";
import LanguageSwitcher from "@/components/atoms/languageSwitcher";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { Settings, Bell, User, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown() {
  const { user } = useAuth();
  const { mutate: logout } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors",
          "hover:bg-[var(--color-bg)]",
          open && "bg-[var(--color-bg)]"
        )}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: "var(--color-bg-primary)",
            color: "var(--color-text-button)",
          }}
        >
          {initial}
        </div>

        {/* Name + Email */}
        <div className="hidden sm:flex flex-col leading-tight text-start">
          <Text size="sm" weight="bold" tag="span">
            {user?.name ?? "User"}
          </Text>
          <Text size="sm" color="gray-200" tag="span" className="text-[11px]">
            {user?.email ?? ""}
          </Text>
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn("ds-text-gray-200 transition-transform duration-200 shrink-0", open && "rotate-180")}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute end-0 top-full mt-2 z-50 rounded-2xl overflow-hidden w-56"
          style={{
            background: "var(--color-bg-form)",
            border: "1px solid var(--color-border-inputs)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}
        >
          {/* User info header */}
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-form)" }}
          >
            <Text size="sm" weight="bold" tag="p">{user?.name ?? "User"}</Text>
            <Text size="sm" color="gray-200" tag="p" className="text-[12px] mt-0.5">
              {user?.email ?? ""}
            </Text>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 ds-text-sm ds-text-primary hover:bg-[var(--color-bg)] transition-colors"
            >
              <User size={17} className="ds-text-gray-100 shrink-0" />
              <Text size="sm" tag="span">Profile</Text>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 ds-text-sm ds-text-primary hover:bg-[var(--color-bg)] transition-colors"
            >
              <Settings size={17} className="ds-text-gray-100 shrink-0" />
              <Text size="sm" tag="span">Settings</Text>
            </Link>
          </div>

          {/* Logout */}
          <div style={{ borderTop: "1px solid var(--color-border-form)" }}>
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-5 py-3 ds-text-sm transition-colors hover:bg-red-50"
            >
              <LogOut size={17} className="shrink-0" style={{ color: "var(--color-error)" }} />
              <Text size="sm" tag="span" color="error">Log Out</Text>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────────
export default function DashboardNavbar() {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4"
      style={{
        height: "var(--navbar-height)",
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 flex-1 max-w-xs rounded-xl px-3"
        style={{
          height: "38px",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border-inputs)",
        }}
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-gray-200)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Searching..."
          className="bg-transparent outline-none w-full ds-text-sm ds-text-primary placeholder:ds-text-gray-200"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg)] transition-colors relative ds-text-gray-100"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-red-500" />
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme */}
        <ThemeButton />

        {/* Divider */}
        <div
          className="w-px h-6 mx-1 shrink-0"
          style={{ background: "var(--navbar-border, var(--color-border-form))" }}
        />

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}