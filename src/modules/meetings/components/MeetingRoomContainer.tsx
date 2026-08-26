"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import MeetingPasswordGate from "./room/MeetingPasswordGate";
import { MeetingRoomPage } from "./room/MeetingRoomPage";
import { MeetingAccessDenied } from "./MeetingAccessDenied";
import { useRoomSession } from "../hooks/useRoomSession";
import { useMeetingDetails } from "../hooks/useMeetings";
import { useMeetingAccess } from "../hooks/useMeetingAccess";

interface MeetingRoomContainerProps {
  meetingId: string | number;
}

/**
 * Owns the `/meetings/{id}/room` stage machine.
 *
 * Living on its own route (rather than as a flag inside the details page) is
 * what makes a refresh survivable: the URL says which meeting, and the stored
 * session says whether we were already inside it.
 *
 * There is no device-setup step: camera, microphone, speaker and background all
 * live in the room's own settings panel, so joining goes straight in. Only a
 * private meeting stops on the way, because `media/join` needs its password.
 *
 * Entry is invitation-only, and this route — not the details page — is where
 * that has to be enforced: the room URL is guessable and shareable, so a check
 * that lives only behind the Join button is no check at all.
 */
export function MeetingRoomContainer({ meetingId }: MeetingRoomContainerProps) {
  const t = useTranslations("meetings");
  const router = useRouter();
  const { session, restored, save, clear } = useRoomSession(meetingId);
  const { data: meeting, isLoading } = useMeetingDetails(meetingId);
  const access = useMeetingAccess(meetingId);
  // Latches on Leave. Without it the auto-join effect below races the `clear()`
  // that leaving performs and immediately re-joins the room the user just left.
  const [hasLeft, setHasLeft] = useState(false);

  const needsPassword = Boolean(meeting?.is_private);
  const ready = restored && !isLoading && !access.isLoading;

  // A public meeting has nothing to ask, so mark the session joined as soon as
  // we know that — this is what removes the old pre-join screen.
  useEffect(() => {
    if (ready && access.canJoin && !hasLeft && !session.joined && !needsPassword) {
      save({ joined: true });
    }
  }, [ready, access.canJoin, hasLeft, session.joined, needsPassword, save]);

  // `hasLeft` covers the frames between Leave and the route actually changing —
  // without it a public meeting would flash the password gate on the way out.
  if (!ready || hasLeft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] gap-3 bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-white">
        <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">
          {hasLeft ? t("list.leaving") : t("list.joining")}
        </p>
      </div>
    );
  }

  // Checked before `session.joined`, so a stored session from an earlier visit
  // cannot carry an uninvited account back into the room.
  if (!access.canJoin) {
    return (
      <MeetingAccessDenied
        reason={access.reason}
        meetingTitle={meeting?.title}
        variant="dark"
      />
    );
  }

  if (session.joined) {
    return (
      <MeetingRoomPage
        meetingId={meetingId}
        password={session.password ?? null}
        onLeave={() => {
          setHasLeft(true);
          clear();
          // Back to the meeting's own page — the waiting room — rather than the
          // full list, so rejoining is one click away.
          router.push(`/meetings/${meetingId}`);
        }}
      />
    );
  }

  return (
    <MeetingPasswordGate
      title={meeting?.title}
      onCancel={() => router.push(`/meetings/${meetingId}`)}
      onSubmit={(password) => save({ joined: true, password })}
    />
  );
}
