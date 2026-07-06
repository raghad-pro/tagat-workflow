"use client";

import { useAuth } from "@/providers/AuthProvider";
import { tokenService } from "@/services/tokenServices";
import { PageSkeleton } from "@/components/atoms/PageSkeleton";
import { CompanyManagementPage } from "./CompanyManagementPage";
import { AvailableCompaniesPage } from "./AvailableCompaniesPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CompaniesWrapper() {
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

  // If the user is a client, show the Available Companies page
  if (user.role === "client") {
    return <AvailableCompaniesPage />;
  }

  // Otherwise, show the Company Management page
  return <CompanyManagementPage />;
}
