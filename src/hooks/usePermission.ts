"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Reads the current user's permissions.
 *
 * This gates the *interface* only. The server is the real authority — every
 * endpoint checks permissions itself — so hiding a control here is about not
 * offering someone an action that will only fail, not about security.
 *
 * That is why an unresolved permission set means "allow": the check is a
 * courtesy, and failing it closed would black out the app over a dropped
 * request while the server would have served every one of those pages.
 */
export function usePermission() {
  const { user } = useAuth();

  const granted = useMemo(
    () => (user?.permissions ? new Set(user.permissions) : null),
    [user?.permissions]
  );

  return useMemo(() => {
    /** True when the permission is held — or when nothing is known yet. */
    const can = (permission?: string | null): boolean => {
      if (!permission) return true;
      if (!granted) return true;
      return granted.has(permission);
    };

    /**
     * True only when the permission is *explicitly* held.
     *
     * Unlike `can`, an unresolved set answers `false`. Use this to decide
     * whether to **open up** something the user would not otherwise reach —
     * never to take access away.
     *
     * The distinction matters because the server's permission rows do not
     * match what its routes actually serve: `company_admin` holds no
     * `conversations.view`, yet `GET /company/conversations` returns 200. A
     * check that removed access on a missing row would hide working pages.
     */
    const hasPermission = (permission?: string | null): boolean => {
      if (!permission || !granted) return false;
      return granted.has(permission);
    };

    return {
      can,
      hasPermission,
      /** True when *any* of them is held. */
      canAny: (permissions: string[]) =>
        permissions.length === 0 || permissions.some((p) => can(p)),
      /** True when *all* of them are held. */
      canAll: (permissions: string[]) => permissions.every((p) => can(p)),
      /** `false` while permissions are still unknown. */
      isResolved: granted !== null,
      permissions: user?.permissions ?? [],
    };
  }, [granted, user?.permissions]);
}
