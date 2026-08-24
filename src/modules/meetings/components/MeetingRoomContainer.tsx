"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MeetingPasswordGate from "./room/MeetingPasswordGate";
import { MeetingRoomPage } from "./room/MeetingRoomPage";
import { useRoomSession } from "../hooks/useRoomSession";
import { useMeetingDetails } from "../hooks/useMeetings";

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
 */
export function MeetingRoomContainer({ meetingId }: MeetingRoomContainerProps) {
  const router = useRouter();
  const { session, restored, save, clear } = useRoomSession(meetingId);
  const { data: meeting, isLoading } = useMeetingDetails(meetingId);
  // Latches on Leave. Without it the auto-join effect below races the `clear()`
  // that leaving performs and immediately re-joins the room the user just left.
  const [hasLeft, setHasLeft] = useState(false);

  const needsPassword = Boolean(meeting?.is_private);
  const ready = restored && !isLoading;

  // A public meeting has nothing to ask, so mark the session joined as soon as
  // we know that — this is what removes the old pre-join screen.
  useEffect(() => {
    if (ready && !hasLeft && !session.joined && !needsPassword) {
      save({ joined: true });
    }
  }, [ready, hasLeft, session.joined, needsPassword, save]);

  // `hasLeft` covers the frames between Leave and the route actually changing —
  // without it a public meeting would flash the password gate on the way out.
  if (!ready || hasLeft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] gap-3 bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-white">
        <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">
          {hasLeft ? "Leaving the meeting…" : "Joining the meeting…"}
        </p>
      </div>
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
