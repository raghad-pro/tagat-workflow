"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";

type Role = "super_admin" | "company" | "employee" | "client";

export default function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      // User requested to redirect to login, which means logging them out completely
      logout();
    }
  }, [user, isLoading, logout, allowedRoles]);

  if (isLoading) return null;
  if (!user || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}