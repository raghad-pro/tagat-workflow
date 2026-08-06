"use client";

import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { useEffect } from "react";

type Role = "super_admin" | "company" | "employee" | "client";

export default function RoleGuard({
  children,
  allowedRoles,
  grantedByPermission,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
  /**
   * An **additional** way in: a custom role holding this permission is let
   * through even when its base role is not in `allowedRoles`.
   *
   * It can only open the page, never close it. Without this the guard sat
   * behind the roles feature and undid it — and it does not merely hide the
   * page, it calls `logout()`, so a user granted a permission would be thrown
   * out of the app for using it.
   */
  grantedByPermission?: string;
}) {
  const { user, isLoading, logout } = useAuth();
  const { hasPermission, isResolved } = usePermission();

  const roleAllowed = !!user && allowedRoles.includes(user.role);

  // Permissions land a moment after the user does. Judging — and logging out —
  // on "not known yet" would evict exactly the accounts this prop is for.
  const undecided = !!grantedByPermission && !roleAllowed && !isResolved;

  const allowed =
    !!user && (roleAllowed || hasPermission(grantedByPermission) || undecided);

  useEffect(() => {
    if (!isLoading && user && !allowed) logout();
  }, [user, isLoading, logout, allowed]);

  if (isLoading) return null;
  if (!allowed) return null;
  if (undecided) return null;

  return <>{children}</>;
}
