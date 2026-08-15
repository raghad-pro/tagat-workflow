import { KpisDashboardPage } from "@/modules/kpis/components/KpisDashboardPage";
import RoleGuard from "@/guards/RoleGuard";

export default function KpisPage() {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "company"]}
      grantedByPermission="kpis.view"
    >
      <KpisDashboardPage />
    </RoleGuard>
  );
}
