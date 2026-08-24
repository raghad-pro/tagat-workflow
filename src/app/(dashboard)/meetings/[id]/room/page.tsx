import { use } from "react";
import { MeetingRoomContainer } from "@/modules/meetings/components/MeetingRoomContainer";
import RoleGuard from "@/guards/RoleGuard";

interface MeetingRoomPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingRoomRoute({ params }: MeetingRoomPageProps) {
  const { id } = use(params);

  return (
    <RoleGuard
      allowedRoles={["super_admin", "company", "employee", "client"]}
      grantedByPermission="meetings.view"
    >
      <MeetingRoomContainer meetingId={id} />
    </RoleGuard>
  );
}
