"use client";

import { useEffect }           from "react";
import { useRouter }           from "next/navigation";
import { CompanyDashboard }    from "./CompanyDashboard";
import { SuperAdminDashboard } from "./SuperAdminDashboard";
import { EmployeeDashboard }   from "./EmployeeDashboard";
import { ClientDashboard }     from "./ClientDashboard";
import { useAuth }             from "@/providers/AuthProvider";
import { tokenService }        from "@/services/tokenServices";
import { PageSkeleton }        from "@/components/atoms/PageSkeleton";

export function DashboardPage() {
  const { user, isLoading } = useAuth();
  const token = tokenService.getToken();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !token)) {
      router.replace("/login");
    }
  }, [isLoading, user, token, router]);

  // Show skeleton while loading OR while redirecting (user just logged out)
  if (isLoading || !user || !token) {
    return <PageSkeleton variant="dashboard" />;
  }

  switch (user.role) {
    case "super_admin":
      return <SuperAdminDashboard role={user.role} token={token} />;
    case "company_admin":
      return <CompanyDashboard role={user.role} token={token} />;
    case "employee":
      return <EmployeeDashboard role={user.role} token={token} />;
    case "client":
      return <ClientDashboard role={user.role} token={token} />;
    default:
      return (
        <div className="p-8 text-center ds-text-priority-high">
          Unknown role
        </div>
      );
  }
}