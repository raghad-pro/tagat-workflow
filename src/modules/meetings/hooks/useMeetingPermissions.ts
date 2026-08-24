"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMeetingDetails, useMeetingParticipants } from "./useMeetings";

export interface MeetingPermissions {
  /** Our role on the roster, or null before we have joined. */
  myRole: string | null;
  /** Host or co-host on the roster. Required by polls and whiteboard management. */
  isModerator: boolean;
  /** Moderator, or the account that created the meeting. Required by lifecycle actions. */
  isOwner: boolean;
  /** `PUT /meetings/{id}` is rejected with 409 once a meeting has started. */
  canEdit: boolean;
  canStart: boolean;
  canEnd: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canChangeRoles: boolean;
  /** Polls and whiteboard management check the roster role, not the creator. */
  canManagePolls: boolean;
  canManageWhiteboard: boolean;
}

/**
 * Mirrors the API's own authorisation, verified endpoint by endpoint.
 *
 * The backend draws two different lines and the UI has to respect both:
 *   - lifecycle (end, invite, change roles) → "host, co-host, **or creator**"
 *   - polls and whiteboard management       → "**a host or co-host**" only
 *
 * An account-level role such as `company` or `super_admin` grants nothing here:
 * a company manager who joins someone else's meeting lands as a plain
 * participant and every moderator action returns 403.
 */
export function useMeetingPermissions(meetingId: number | string): MeetingPermissions {
  const { user } = useAuth();
  const { data: meeting } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);

  return useMemo(() => {
    const myRow = participants.find(
      (p: any) => Number(p.user_id) === Number(user?.id)
    );
    const myRole = myRow?.role ?? null;

    const isModerator = myRole === "host" || myRole === "co_host";
    const isCreator =
      meeting?.created_by != null && Number(meeting.created_by) === Number(user?.id);
    const isOwner = isModerator || isCreator;

    const notStarted = meeting?.status === "waiting";

    return {
      myRole,
      isModerator,
      isOwner,
      canEdit: isOwner && notStarted,
      canStart: isOwner && notStarted,
      canEnd: isOwner && meeting?.status === "live",
      canDelete: isOwner,
      canInvite: isOwner,
      canChangeRoles: isOwner,
      canManagePolls: isModerator,
      canManageWhiteboard: isModerator,
    };
  }, [participants, meeting, user?.id]);
}
