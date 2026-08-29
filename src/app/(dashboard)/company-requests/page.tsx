import Joinrequestspage from "@/modules/company-requests/components/Joinrequestspage";
import RoleGuard from "@/guards/RoleGuard";

export default function Page() {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "company"]}
      grantedByPermission="company_requests.view"
    >
      <Joinrequestspage />
    </RoleGuard>
  );
}