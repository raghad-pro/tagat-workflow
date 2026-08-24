"use client";

import { useCallback, useEffect, useState } from "react";
import type { MediaPreferences } from "./useMediaPreferences";

export interface RoomSession {
  joined: boolean;
  password?: string;
  preferences?: MediaPreferences | null;
}

const EMPTY: RoomSession = { joined: false };

const keyFor = (meetingId: number | string) => `meeting_session_${meetingId}`;

/**
 * Keeps "I am in this room" across a page reload.
 *
 * Without this the room stage lives only in React state, so refreshing drops
 * the user back to the meeting details page. Stored in `sessionStorage` so it
 * is scoped to the tab and disappears when the tab closes — and cleared
 * outright when the user leaves the meeting.
 */
export function useRoomSession(meetingId: number | string) {
  const [session, setSession] = useState<RoomSession>(EMPTY);
  // Distinguishes "nothing stored" from "not read yet", so the room does not
  // flash the setup screen before the stored session is restored.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(keyFor(meetingId));
      setSession(raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY);
    } catch {
      setSession(EMPTY);
    }
    setRestored(true);
  }, [meetingId]);

  const save = useCallback(
    (next: RoomSession) => {
      setSession(next);
      try {
        sessionStorage.setItem(keyFor(meetingId), JSON.stringify(next));
      } catch {
        // Losing the session only costs a re-join; never block on storage.
      }
    },
    [meetingId]
  );

  const clear = useCallback(() => {
    setSession(EMPTY);
    try {
      sessionStorage.removeItem(keyFor(meetingId));
    } catch {
      // Nothing to do — the entry is tab-scoped and expires anyway.
    }
  }, [meetingId]);

  return { session, restored, save, clear };
}
