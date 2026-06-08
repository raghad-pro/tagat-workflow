"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";

type Role = "super_admin" | "company_admin" | "employee" | "client";

export default function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (!user || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}