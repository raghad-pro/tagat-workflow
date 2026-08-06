"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
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
  // A company administers its own roles through `/company/roles`, so this is
  // not a super-admin-only screen.
  "/roles": ["super_admin", "company"],
  "/access": ["super_admin", "company"],
  "/employees": ["super_admin", "company"],
  "/projects": ["super_admin", "company", "employee", "client"],
  "/tasks": ["super_admin", "company", "employee"],
  "/timesheets": ["super_admin", "company", "employee"],
  "/developments": ["super_admin", "company"],
  "/contracts": ["super_admin", "company"],
  "/salaries": ["super_admin", "company"],
};

/**
 * Permission that grants a route to someone whose **role** does not already
 * cover it — a custom role opening up a section.
 *
 * It is deliberately not a requirement. The server's permission rows disagree
 * with its own routes: `company_admin` holds no `conversations.view` yet
 * `GET /company/conversations` returns 200, and no base role except
 * `super_admin` holds it at all. Treating a missing row as "deny" would bounce
 * users off pages the API serves them quite happily.
 */
const ROUTE_GRANTED_BY_PERMISSION: Record<string, string> = {
  "/companies": "companies.view",
  "/company-requests": "company_requests.view",
  "/clients": "clients.view",
  "/invoices": "invoices.view",
  "/payments": "payments.view",
  "/wallets": "wallets.view",
  "/wallet-transactions": "wallet_transactions.view",
  "/currencies": "currencies.view",
  "/roles": "roles.view",
  "/access": "employees.update",
  "/employees": "employees.view",
  "/projects": "projects.view",
  "/tasks": "tasks.view",
  "/timesheets": "timesheets.view",
  "/developments": "developments.view",
  "/contracts": "contracts.view",
  "/conversations": "conversations.view",
};

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { hasPermission } = usePermission();
  const pathname = usePathname();

  const baseRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const grantRoute = Object.keys(ROUTE_GRANTED_BY_PERMISSION).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const roleAllowed =
    !baseRoute || !user || ROUTE_PERMISSIONS[baseRoute].includes(user.role as Role);

  // A custom role can open a route the base role does not list. It can never
  // close one — see the note on ROUTE_GRANTED_BY_PERMISSION.
  const permissionAllowed =
    !!grantRoute && hasPermission(ROUTE_GRANTED_BY_PERMISSION[grantRoute]);

  const allowed = roleAllowed || permissionAllowed;

  useEffect(() => {
    if (isLoading || !user) return;
    if (!allowed) logout();
  }, [user, isLoading, allowed, logout]);

  if (isLoading || !user) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
