"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { PageSkeleton } from "@/components/atoms/PageSkeleton";
import { ENV } from "@/config/env";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ENV.DISABLE_DASHBOARD_PROTECTION) return;
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (ENV.DISABLE_DASHBOARD_PROTECTION) return <>{children}</>;
  if (isLoading) return <PageSkeleton variant="dashboard" />;
  if (!isAuthenticated) return <PageSkeleton variant="dashboard" />;

  return <>{children}</>;
}