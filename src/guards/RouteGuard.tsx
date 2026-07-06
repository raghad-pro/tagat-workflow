"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";

type Role = "super_admin" | "company" | "employee" | "client";

// This maps routes to the roles that are allowed to access them.
// If a route is not here (like /profile), it is allowed for everyone.
const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard": ["super_admin", "company", "employee", "client"],
  "/companies": ["super_admin", "client"],
  "/company-requests": ["super_admin", "company"],
  "/clients": ["super_admin", "company"],
  "/invoices": ["super_admin", "company", "client"],
  "/payments": ["super_admin", "company", "client"],
  "/wallets": ["super_admin", "company"],
  "/wallet-transactions": ["super_admin", "company"],
  "/currencies": ["super_admin", "company"],
  "/roles": ["super_admin"],
  "/employees": ["super_admin", "company"],
  "/projects": ["super_admin", "company", "employee", "client"],
  "/tasks": ["super_admin", "company", "employee"],
  "/timesheets": ["super_admin", "company", "employee"],
  "/developments": ["super_admin", "company"],
  "/contracts": ["super_admin", "company"],
  "/salaries": ["super_admin", "company"],
};

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const baseRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  useEffect(() => {
    if (isLoading || !user) return;

    if (baseRoute) {
      const allowedRoles = ROUTE_PERMISSIONS[baseRoute];
      if (!allowedRoles.includes(user.role as Role)) {
        logout();
      }
    }
  }, [user, isLoading, baseRoute, logout]);

  if (isLoading || !user) return null;

  if (baseRoute) {
    const allowedRoles = ROUTE_PERMISSIONS[baseRoute];
    if (!allowedRoles.includes(user.role as Role)) {
      return null; // Don't render children if unauthorized, wait for logout redirect
    }
  }

  return <>{children}</>;
}
