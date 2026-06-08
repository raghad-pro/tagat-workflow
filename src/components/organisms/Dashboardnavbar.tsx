"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeButton from "@/components/atoms/ThemeButton";
import { useAuth } from "@/providers/AuthProvider";
import { Settings, Bell } from "lucide-react";
import Link from "next/link";

export default function DashboardNavbar() {
  const { user } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4"
      style={{
        height: "var(--navbar-height)",
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      {/* Sidebar Toggle */}
      <SidebarTrigger
        className="text-[var(--sidebar-item-text)] hover:text-[var(--sidebar-item-active-text)]
                   hover:bg-[var(--sidebar-item-hover)] rounded-lg p-2 transition-colors"
      />

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
          className="bg-transparent outline-none w-full text-sm"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-2">

        {/* Settings */}
        <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
          <Settings size={18} />
          </Link>
        

        {/* Notifications */}
        <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors relative">
       <Bell size={18} />
        
          {/* Badge */}
          <span
            className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-red-500 "></span>
           
          
          </Link>
        

        {/* Theme */}
        <ThemeButton />

        {/* Divider */}
        <div
          className="w-px h-6 mx-1"
          style={{ background: "var(--navbar-border)" }}
        />

        {/* Avatar + Info */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          {/* Avatar Circle */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: "var(--color-bg-primary)",
              color: "var(--color-text-button)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>

          {/* Name + Role */}
          <div className="hidden sm:flex flex-col leading-tight">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {user?.name ?? "User"}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-gray-200)" }}
            >
              {user?.email ?? ""}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}