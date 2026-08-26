"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingDetails,
  useMeetingParticipants,
  useMeetingInvitations,
} from "./useMeetings";
import type { InvitationStatus } from "../types/meetings.types";

export type MeetingAccessReason =
  /** Created the meeting — never lock a host out of their own room. */
  | "creator"
  /** Already on the roster, so they were admitted at some point. */
  | "participant"
  /** Holds an invitation that has not been declined. */
  | "invited"
  /** Was invited and turned it down. */
  | "declined"
  /** Proven absent from the invitation list. */
  | "not_invited"
  /** The invitation list could not be read; only the server can decide. */
  | "undetermined";

export interface MeetingAccess {
  isLoading: boolean;
  /**
   * Whether the Join button should be offered. `false` only when we can
   * *positively prove* there is no usable invitation — see `undetermined`.
   */
  canJoin: boolean;
  reason: MeetingAccessReason;
  invitationStatus: InvitationStatus | null;
  /** The viewer's own invitation row, when one was readable. Answering it
   *  needs the id, and this hook has already found it. */
  invitationId: number | null;
}

/**
 * Decides whether the current account may enter a meeting room.
 *
 * The rule is "invitation only": the creator and anyone already on the roster
 * get in, everyone else needs an invitation that they have not declined.
 *
 * This is a **UI gate, not the security boundary.** The browser can always
 * `POST /meetings/{id}/media/join` directly, so the server has to enforce the
 * same rule for it to mean anything — the room already surfaces the API's own
 * rejection message when it does. What this hook buys is that an uninvited
 * account is never shown a Join button that leads to a dead end.
 *
 * When the invitation list cannot be read — a plain participant may not be
 * allowed to `GET /meetings/{id}/invitations` — the answer is `undetermined`
 * and the join is *allowed* to proceed, leaving the verdict to the API. Denying
 * on a failed read would lock out legitimately invited people, which is the
 * worse of the two failures.
 */
export function useMeetingAccess(meetingId: number | string): MeetingAccess {
  const { user } = useAuth();
  const { data: meeting, isLoading: loadingMeeting } = useMeetingDetails(meetingId);
  const { data: participants = [], isLoading: loadingParticipants } =
    useMeetingParticipants(meetingId);
  const {
    data: invitations = [],
    isLoading: loadingInvitations,
    isError: invitationsUnreadable,
  } = useMeetingInvitations(meetingId);

  return useMemo<MeetingAccess>(() => {
    const isLoading = loadingMeeting || loadingParticipants || loadingInvitations;
    if (isLoading || !user?.id) {
      return { isLoading: true, canJoin: false, reason: "undetermined", invitationStatus: null, invitationId: null };
    }

    const myId = Number(user.id);

    if (meeting?.created_by != null && Number(meeting.created_by) === myId) {
      return { isLoading: false, canJoin: true, reason: "creator", invitationStatus: null, invitationId: null };
    }

    const onRoster = participants.some((p: any) => Number(p.user_id) === myId);
    if (onRoster) {
      return { isLoading: false, canJoin: true, reason: "participant", invitationStatus: null, invitationId: null };
    }

    if (invitationsUnreadable) {
      return { isLoading: false, canJoin: true, reason: "undetermined", invitationStatus: null, invitationId: null };
    }

    const myInvitation = invitations.find((i: any) => Number(i.user_id) === myId);
    if (!myInvitation) {
      return { isLoading: false, canJoin: false, reason: "not_invited", invitationStatus: null, invitationId: null };
    }

    // A declined invitation is a decision, not a lack of one. Re-entering takes
    // a fresh invitation from the host.
    if (myInvitation.status === "declined") {
      return {
        isLoading: false,
        canJoin: false,
        reason: "declined",
        invitationStatus: "declined",
        invitationId: Number(myInvitation.id) || null,
      };
    }

    return {
      isLoading: false,
      canJoin: true,
      reason: "invited",
      invitationStatus: myInvitation.status ?? null,
      invitationId: Number(myInvitation.id) || null,
    };
  }, [
    loadingMeeting,
    loadingParticipants,
    loadingInvitations,
    invitationsUnreadable,
    user?.id,
    meeting?.created_by,
    participants,
    invitations,
  ]);
}
