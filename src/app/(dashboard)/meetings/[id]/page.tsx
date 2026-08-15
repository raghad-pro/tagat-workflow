import { use } from "react";
import { MeetingRoomPage } from "@/modules/meetings/components/room/MeetingRoomPage";
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
      <MeetingRoomPage meetingId={id} />
    </RoleGuard>
  );
}
