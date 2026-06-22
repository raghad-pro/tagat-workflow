"use client";

import React from "react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function SidebarSkeleton() {
  return (
    <Sidebar className="border-e border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] z-50">
      {/* Logo Area */}
      <SidebarHeader
        className="border-b border-[var(--sidebar-border)] px-4 flex items-center justify-center"
        style={{ height: "var(--navbar-height)" }}
      >
        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
      </SidebarHeader>

      {/* Nav Groups Area */}
      <SidebarContent className="px-2 py-4">
        {[1, 2, 3].map((group) => (
          <SidebarGroup key={group} className="p-0 mb-6">
            <div className="w-24 h-3 mb-3 ml-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
            <SidebarMenu>
              {[1, 2, 3].map((item) => (
                <SidebarMenuItem key={item}>
                  <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg">
                    <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
