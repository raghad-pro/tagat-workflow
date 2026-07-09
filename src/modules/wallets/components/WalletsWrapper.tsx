"use client";

import { useAuth } from "@/providers/AuthProvider";
import { tokenService } from "@/services/tokenServices";
import { PageSkeleton } from "@/components/atoms/PageSkeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WalletsManagementPage } from "./WalletsManagementPage";

export function WalletsWrapper() {
  const { user, isLoading } = useAuth();
  const token = tokenService.getToken();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !token)) {
      router.replace("/login");
    }
  }, [isLoading, user, token, router]);

  if (isLoading || !user || !token) {
    return <PageSkeleton variant="dashboard" />;
  }

  return <WalletsManagementPage />;
}
