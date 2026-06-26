"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { PageSkeleton } from "@/components/atoms/PageSkeleton";

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // لو بعد Loading لسا مش Authenticated → عرض الصفحة (login/register)
  if (isLoading) return <PageSkeleton variant="dashboard" />;
  if (isAuthenticated) return <PageSkeleton variant="dashboard" />;

  return <>{children}</>;
}