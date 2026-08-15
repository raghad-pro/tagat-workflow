import { MeetingsManagementPage } from "@/modules/meetings/components/MeetingsManagementPage";
import RoleGuard from "@/guards/RoleGuard";

export default function MeetingsPage() {
  return (
    <RoleGuard
      allowedRoles={["super_admin", "company", "employee", "client"]}
      grantedByPermission="meetings.view"
    >
      <MeetingsManagementPage />
    </RoleGuard>
  );
}
