"use client";

import React from "react";
import { Mic, MicOff, Hand, ScreenShare, Pin, PinOff } from "lucide-react";
import {
  VideoTrack,
  useParticipants,
  useTracks,
  type TrackReference,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";

import { cn } from "@/lib/utils";
import { useMeetingUserDirectory } from "../../hooks/useMeetingUserDirectory";
import type { MeetingParticipant } from "../../types/meetings.types";

/** LiveKit identities are minted server-side as `user-{id}`. */
export function userIdFromIdentity(identity: string): number | null {
  const match = /^user-(\d+)$/.exec(identity);
  return match ? Number(match[1]) : null;
}

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface TileProps {
  participant: Participant;
  isLocal: boolean;
  isHost: boolean;
  handRaised: boolean;
  displayName: string;
  /** Camera publication for this participant, resolved once by the parent. */
  cameraRef?: TrackReference;
  /** Renders the tile at stage size rather than as a thumbnail. */
  large?: boolean;
  /** Fills a small fixed-size slot, so adaptive streaming requests low res. */
  thumbnail?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

function ParticipantTile({
  participant,
  isLocal,
  isHost,
  handRaised,
  displayName,
  cameraRef,
  large = false,
  thumbnail = false,
  isPinned = false,
  onTogglePin,
}: TileProps) {
  // Render the video element whenever an unmuted publication exists: with
  // adaptive streaming, attaching the element is what triggers the
  // subscription. The avatar stays on top until a real track arrives, so a
  // pending subscription never shows as a blank tile.
  const publication = cameraRef?.publication;
  const hasPublication = Boolean(publication && !publication.isMuted);
  const isPlaying = Boolean(publication?.track && !publication.isMuted);
  const isSpeaking = participant.isSpeaking;
  const micOn = participant.isMicrophoneEnabled;

  return (
    <div
      className={cn(
        "relative bg-[#161B22] border rounded-[16px] p-2.5 flex flex-col justify-between items-center shadow-lg transition-all select-none overflow-hidden group",
        large || thumbnail ? "w-full h-full" : "w-[318px] h-[179px]",
        thumbnail && "p-1.5 rounded-[12px]",
        isSpeaking
          ? "border-[#22C55E] ring-2 ring-[#22C55E]/40"
          : "border-[#1E293B]/80 hover:border-[#25C6DA]/40"
      )}
      style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)" }}
    >
      {hasPublication && cameraRef && (
        <VideoTrack
          trackRef={cameraRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover rounded-[16px] z-0",
            // Mirror only our own preview, the way every conferencing app does.
            isLocal && "scale-x-[-1]"
          )}
        />
      )}

      <div className="w-full flex items-center justify-between px-1 z-10">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            micOn
              ? isSpeaking
                ? "bg-[#22C55E] text-white shadow-sm"
                : "bg-[#25C6DA]/20 text-[#25C6DA]"
              : "bg-red-500/20 text-red-400"
          )}
        >
          {micOn ? <Mic size={12} /> : <MicOff size={12} />}
        </div>

        <div className="flex items-center gap-1">
          {handRaised && (
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center animate-bounce shadow-sm">
              <Hand size={12} />
            </div>
          )}
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? "Unpin" : "Pin to the big tile"}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                isPinned
                  ? "bg-[#25C6DA] text-white"
                  : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
              )}
            >
              {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
            </button>
          )}
        </div>
      </div>

      {!isPlaying && (
        <div className="flex items-center justify-center my-auto z-10">
          <div
            className={cn(
              "w-[64px] h-[64px] rounded-full text-white flex items-center justify-center text-[20px] font-bold shadow-[0_4px_14px_rgba(37,198,218,0.4)] transition-all",
              isSpeaking ? "bg-[#22C55E] ring-4 ring-[#22C55E]/30" : "bg-[#25C6DA]"
            )}
          >
            {getInitials(displayName)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 self-start z-10 mt-auto">
        <span className="px-2 py-0.5 rounded-[10px] bg-black/60 text-white text-[11px] font-semibold leading-tight backdrop-blur-xs">
          {displayName}
        </span>
        {isLocal && (
          <span className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(37,198,218,0.8)] text-white text-[9px] font-bold leading-tight">
            YOU
          </span>
        )}
        {isHost && (
          <span className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(245,158,11,0.8)] text-white text-[9px] font-bold leading-tight">
            HOST
          </span>
        )}
      </div>
    </div>
  );
}

export type MediaLayout = "grid" | "speaker";

interface LiveParticipantGridProps {
  /** Roster rows from the API, used to resolve display names and roles. */
  roster: MeetingParticipant[];
  remoteHands: Record<string, boolean>;
  localHandRaised: boolean;
  fallbackName: string;
  meetingId: number | string;
  layout: MediaLayout;
  /** Identity kept on the big tile regardless of who is talking. */
  pinnedIdentity: string | null;
  onPinChange: (identity: string | null) => void;
}

/**
 * Renders one tile per participant actually connected to the media room.
 * The API roster only supplies names and roles — presence comes from LiveKit.
 */
export default function LiveParticipantGrid({
  roster,
  remoteHands,
  localHandRaised,
  fallbackName,
  meetingId,
  layout,
  pinnedIdentity,
  onPinChange,
}: LiveParticipantGridProps) {
  const participants = useParticipants();
  const { resolveName, rememberUserName } = useMeetingUserDirectory(meetingId);
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const cameraByIdentity = new Map<string, TrackReference>();
  cameraTracks.forEach((t) => {
    if (t.publication) cameraByIdentity.set(t.participant.identity, t as TrackReference);
  });
  const activeScreen = screenTracks.find((t) => !t.publication?.isMuted);

  const rosterByUserId = new Map<number, MeetingParticipant>();
  roster.forEach((p) => rosterByUserId.set(Number(p.user_id), p));

  const resolve = (p: Participant) => {
    const userId = userIdFromIdentity(p.identity);
    const row = userId !== null ? rosterByUserId.get(userId) : undefined;
    if (p.name) rememberUserName(userId, p.name);
    // LiveKit carries the name in the token, but fall back to the directory
    // for anyone whose token predates it.
    return {
      displayName: p.name || resolveName(userId, fallbackName),
      isHost: row?.role === "host" || row?.role === "co_host",
    };
  };

  const togglePin = (identity: string) =>
    onPinChange(pinnedIdentity === identity ? null : identity);

  const renderTile = (
    p: Participant,
    opts?: { large?: boolean; thumbnail?: boolean }
  ) => {
    const { displayName, isHost } = resolve(p);
    return (
      <ParticipantTile
        key={p.identity}
        participant={p}
        isLocal={p.isLocal}
        isHost={isHost}
        handRaised={p.isLocal ? localHandRaised : Boolean(remoteHands[p.identity])}
        displayName={displayName}
        cameraRef={cameraByIdentity.get(p.identity)}
        large={opts?.large}
        thumbnail={opts?.thumbnail}
        isPinned={pinnedIdentity === p.identity}
        onTogglePin={() => togglePin(p.identity)}
      />
    );
  };

  const thumbnails = (people: Participant[]) => (
    <div className="flex items-center justify-center flex-wrap gap-3 shrink-0">
      {people.map((p) => (
        <div key={p.identity} className="w-[176px] h-[99px]">
          {renderTile(p, { thumbnail: true })}
        </div>
      ))}
    </div>
  );

  // A screen share always takes the stage, whatever the chosen layout.
  if (activeScreen) {
    const sharer = activeScreen.participant;
    return (
      <div className="w-full h-full flex flex-col gap-4 items-center">
        <div className="w-full flex-1 max-w-5xl rounded-[16px] overflow-hidden border border-[#25C6DA]/50 shadow-2xl relative bg-black flex items-center justify-center">
          <VideoTrack trackRef={activeScreen} className="w-full h-full object-contain" />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-bold text-[#25C6DA] flex items-center gap-2">
            <ScreenShare size={14} />
            <span>
              {sharer.isLocal
                ? "You are sharing your screen"
                : `${resolve(sharer).displayName} is sharing`}
            </span>
          </div>
        </div>
        {thumbnails(participants)}
      </div>
    );
  }

  if (layout === "speaker" && participants.length > 0) {
    // Pinned wins; otherwise follow the active speaker, falling back to the
    // first participant so the stage is never empty.
    const pinned = participants.find((p) => p.identity === pinnedIdentity);
    const speaking = participants.find((p) => p.isSpeaking);
    const feature = pinned || speaking || participants[0];
    const rest = participants.filter((p) => p.identity !== feature.identity);

    return (
      <div className="w-full h-full flex flex-col gap-4 items-center">
        <div className="w-full flex-1 max-w-4xl min-h-0">
          {renderTile(feature, { large: true })}
        </div>
        {rest.length > 0 && thumbnails(rest)}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-wrap gap-4 w-full max-w-4xl">
      {participants.map((p) => renderTile(p))}
    </div>
  );
}
