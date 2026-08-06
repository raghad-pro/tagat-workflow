"use client";

import React from "react";
import { usePermission } from "@/hooks/usePermission";

interface CanProps {
  /** A single permission, e.g. `"invoices.create"`. */
  permission?: string;
  /** Or several — held together by `mode`. */
  permissions?: string[];
  /** `"any"` (default) shows when one is held; `"all"` requires every one. */
  mode?: "any" | "all";
  /** Rendered instead when the check fails. Nothing by default. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders its children only if the current user holds the permission.
 *
 * ```tsx
 * <Can permission="invoices.create">
 *   <Button onClick={openCreate}>New invoice</Button>
 * </Can>
 * ```
 *
 * See `usePermission` for why an unresolved permission set renders the
 * children rather than hiding them.
 */
export function Can({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}: CanProps) {
  const { can, canAny, canAll } = usePermission();

  const list = permissions ?? (permission ? [permission] : []);
  const allowed =
    list.length === 0 ? true : mode === "all" ? canAll(list) : canAny(list);

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
