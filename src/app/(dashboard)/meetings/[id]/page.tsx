import { use } from "react";
import { MeetingDetailsContainer } from "@/modules/meetings/components/MeetingDetailsContainer";
import RoleGuard from "@/guards/RoleGuard";

interface MeetingDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingDetailsPage({ params }: MeetingDetailsPageProps) {
  const { id } = use(params);

  return (
    <RoleGuard
      allowedRoles={["super_admin", "company", "employee", "client"]}
      grantedByPermission="meetings.view"
    >
      <MeetingDetailsContainer meetingId={id} />
    </RoleGuard>
  );
}
