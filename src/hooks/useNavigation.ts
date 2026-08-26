"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { NAV_HUBS, type NavHub, type NavItem, type Role } from "@/config/navigation";

/**
 * The hubs this user can actually reach, with unreachable items stripped and
 * empty hubs dropped. Shared by the sidebar rail and the dashboard launcher so
 * the two can never disagree about what exists.
 */
export function useVisibleHubs(): NavHub[] {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const { hasPermission } = usePermission();

  return useMemo(() => {
    // An item shows when the account's base role covers it, **or** when a
    // custom role explicitly grants its permission. Additive on purpose:
    // permissions can open a section up, never close one off.
    const isVisible = (item: NavItem) =>
      (!role || item.roles.includes(role)) || hasPermission(item.permission);

    return NAV_HUBS
      .map((hub) => ({ ...hub, items: hub.items.filter(isVisible) }))
      .filter((hub) => hub.items.length > 0);
  }, [role, hasPermission]);
}

/** Localised label for a hub, falling back to the config's own strings. */
export function useHubLabel() {
  const t = useTranslations("sidebar");
  const isAr = useLocale() === "ar";

  return (hub: NavHub) => {
    try {
      const label = t(hub.key as Parameters<typeof t>[0]);
      if (label && label !== hub.key) return label;
    } catch {
      /* falls through to the config label */
    }
    return isAr ? hub.arLabel : hub.label;
  };
}
