import { ContractsManagementPage } from "@/modules/contracts/components/ContractsManagementPage";
import RoleGuard from "@/guards/RoleGuard";

export default function ContractsPage() {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "company", "employee", "client"]}
      grantedByPermission="contracts.view"
    >
      <ContractsManagementPage />
    </RoleGuard>
  );
}
