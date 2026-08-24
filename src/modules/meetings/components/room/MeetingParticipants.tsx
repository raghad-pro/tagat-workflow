"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserPlus,
  Hand,
} from "lucide-react";
import { useMaybeRoomContext } from "@livekit/components-react";
import { RoomEvent, type Participant } from "livekit-client";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingDetails,
  useMeetingParticipants,
  useUpdateParticipantRole,
  useSendInvitation,
  useLeaveMeeting,
} from "../../hooks/useMeetings";
import { useMeetingUserDirectory } from "../../hooks/useMeetingUserDirectory";
import { useInvitableUsers } from "../../hooks/useInvitableUsers";
import { ActionModal } from "@/components/molecules/ActionModal";
import { cn } from "@/lib/utils";
import type { ParticipantRole } from "../../types/meetings.types";

/** LiveKit identities are minted server-side as `user-{id}`. */
const userIdFromIdentity = (identity: string): number | null => {
  const match = /^user-(\d+)$/.exec(identity);
  return match ? Number(match[1]) : null;
};

interface LiveState {
  /** Display name carried in the LiveKit token — the most reliable source. */
  name: string;
  micOn: boolean;
  camOn: boolean;
  speaking: boolean;
  handRaised: boolean;
}

interface MeetingParticipantsProps {
  meetingId: number | string;
  isHost: boolean;
}

export default function MeetingParticipants({ meetingId, isHost }: MeetingParticipantsProps) {
  const { user } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>("participant");

  const { data: participants = [], isLoading } = useMeetingParticipants(meetingId);
  const { users: invitableUsers } = useInvitableUsers(meetingId);
  const { resolveName, rememberUserName } = useMeetingUserDirectory(meetingId);

  // Live media state, keyed by user id. The roster API has no camera/mic/hand
  // fields worth trusting, so presence comes straight from LiveKit.
  const room = useMaybeRoomContext();
  const [liveState, setLiveState] = useState<Record<number, LiveState>>({});
  const announcedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!room) {
      setLiveState({});
      return;
    }

    const snapshot = () => {
      const next: Record<number, LiveState> = {};
      const all: Participant[] = [room.localParticipant, ...room.remoteParticipants.values()];
      all.forEach((lp) => {
        const uid = userIdFromIdentity(lp.identity);
        if (uid === null) return;
        if (lp.name) rememberUserName(uid, lp.name);
        next[uid] = {
          name: lp.name || "",
          micOn: lp.isMicrophoneEnabled,
          camOn: lp.isCameraEnabled,
          speaking: lp.isSpeaking,
          handRaised: lp.attributes?.hand_raised === "1",
        };
      });
      setLiveState(next);
    };

    snapshot();

    const onJoin = (p: Participant) => {
      const uid = userIdFromIdentity(p.identity);
      if (uid !== null && !announcedRef.current.has(uid)) {
        announcedRef.current.add(uid);
        toast(`${resolveName(uid, p.name || "Someone")} joined`, { icon: "👋" });
      }
      snapshot();
    };

    const onLeave = (p: Participant) => {
      const uid = userIdFromIdentity(p.identity);
      if (uid !== null) {
        announcedRef.current.delete(uid);
        toast(`${resolveName(uid, p.name || "Someone")} left`, { icon: "🚪" });
      }
      snapshot();
    };

    room
      .on(RoomEvent.ParticipantConnected, onJoin)
      .on(RoomEvent.ParticipantDisconnected, onLeave)
      .on(RoomEvent.TrackMuted, snapshot)
      .on(RoomEvent.TrackUnmuted, snapshot)
      .on(RoomEvent.TrackPublished, snapshot)
      .on(RoomEvent.TrackUnpublished, snapshot)
      .on(RoomEvent.LocalTrackPublished, snapshot)
      .on(RoomEvent.LocalTrackUnpublished, snapshot)
      .on(RoomEvent.ActiveSpeakersChanged, snapshot)
      .on(RoomEvent.ParticipantAttributesChanged, snapshot);

    return () => {
      room
        .off(RoomEvent.ParticipantConnected, onJoin)
        .off(RoomEvent.ParticipantDisconnected, onLeave)
        .off(RoomEvent.TrackMuted, snapshot)
        .off(RoomEvent.TrackUnmuted, snapshot)
        .off(RoomEvent.TrackPublished, snapshot)
        .off(RoomEvent.TrackUnpublished, snapshot)
        .off(RoomEvent.LocalTrackPublished, snapshot)
        .off(RoomEvent.LocalTrackUnpublished, snapshot)
        .off(RoomEvent.ActiveSpeakersChanged, snapshot)
        .off(RoomEvent.ParticipantAttributesChanged, snapshot);
    };
  }, [room]);

  const { mutate: updateRole } = useUpdateParticipantRole();
  const { mutate: sendInvite, isPending: isSendingInvite } = useSendInvitation();

  const handleRoleChange = (participantId: number | string, newRole: ParticipantRole) => {
    updateRole({ participantId, participantRole: newRole, meetingId });
  };

  const handleSendInvite = () => {
    if (!selectedUserId) return;
    sendInvite(
      {
        meetingId,
        payload: {
          user_id: Number(selectedUserId),
          role: selectedRole,
        },
      },
      {
        onSuccess: () => {
          setIsInviteOpen(false);
          setSelectedUserId("");
        },
      }
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white">
      {/* ── Top Header matching Figma (people) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            people ({participants.length})
          </span>
        </div>

        {isHost && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        )}
      </div>

      {/* ── Participants List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            No participants yet.
          </div>
        ) : (
          participants
            .slice()
            .sort((a, b) => {
              // Host first, then anyone actually connected to the media room.
              const rank = (r: string) => (r === "host" ? 0 : r === "co_host" ? 1 : 2);
              const byRole = rank(a.role) - rank(b.role);
              if (byRole !== 0) return byRole;
              const aLive = liveState[Number(a.user_id)] ? 0 : 1;
              const bLive = liveState[Number(b.user_id)] ? 0 : 1;
              return aLive - bLive;
            })
            .map((p) => {
            const userId = Number(p.user_id);
            const isMe = userId === Number(user?.id);
            const live = liveState[userId];
            // LiveKit's token name wins for anyone connected; the directory
            // covers roster rows that have not joined the media room yet.
            const displayName =
              live?.name ||
              resolveName(userId, isMe ? user?.name || "You" : `User #${userId}`);
            const initials = getInitials(displayName);
            const isParticipantHost = p.role === "host" || p.role === "co_host";
            const isInRoom = Boolean(live);

            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-[10px] bg-[#1A2236] border transition-colors",
                  live?.speaking
                    ? "border-[#22C55E] ring-1 ring-[#22C55E]/40"
                    : "border-[#2A3756]/50 hover:border-[#25C6DA]/40"
                )}
              >
                {/* Left info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#25C6DA]/20 text-[#25C6DA] flex items-center justify-center font-bold text-xs border border-[#25C6DA]/40">
                      {initials}
                    </div>
                    {/* Presence dot: green only when truly connected to media */}
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A2236]",
                        isInRoom ? "bg-[#22C55E]" : "bg-[#64748B]"
                      )}
                      title={isInRoom ? "In the room" : "On the roster, not connected"}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-bold text-white leading-tight truncate">
                        {displayName}
                      </span>
                      {isMe && (
                        <span className="px-1.5 rounded bg-[#25C6DA]/20 text-[#25C6DA] text-[9px] font-extrabold">
                          YOU
                        </span>
                      )}
                      {isParticipantHost && (
                        <span className="px-1.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-extrabold uppercase">
                          {p.role === "host" ? "host" : "co-host"}
                        </span>
                      )}
                      {live?.handRaised && (
                        <Hand className="w-3 h-3 text-amber-400 animate-bounce" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#94A3B8] font-medium capitalize">
                      {isInRoom ? p.role.replace("_", " ") : "Not connected"}
                    </span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        !isInRoom
                          ? "bg-black/30 text-[#475569]"
                          : live?.micOn
                            ? live.speaking
                              ? "bg-[#22C55E] text-white"
                              : "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                      )}
                      title={live?.micOn ? "Microphone on" : "Microphone off"}
                    >
                      {live?.micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    </div>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        !isInRoom
                          ? "bg-black/30 text-[#475569]"
                          : live?.camOn
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                      )}
                      title={live?.camOn ? "Camera on" : "Camera off"}
                    >
                      {live?.camOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                    </div>
                  </div>

                  {isHost && !isMe && (
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as ParticipantRole)}
                      className="bg-[#111827] text-white border border-[#2A3756] text-[10px] rounded px-1.5 py-1 focus:outline-none focus:border-[#25C6DA]"
                    >
                      <option value="participant">Participant</option>
                      <option value="viewer">Viewer</option>
                      <option value="co_host">Co-Host</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Member Modal */}
      <ActionModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Member"
        mode="add"
        saveLabel="Send Invite"
        onSubmit={handleSendInvite}
        isLoading={isSendingInvite}
        size="sm"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Select Member</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">
                {invitableUsers.length === 0
                  ? "No one left to invite"
                  : "Choose employee/client..."}
              </option>
              {invitableUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.source})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Room Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ParticipantRole)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="participant">Participant</option>
              <option value="viewer">Viewer</option>
              <option value="co_host">Co-Host</option>
            </select>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
