"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Maximize2,
  Minimize2,
  Users,
  MessageSquare,
  PenTool,
  BookOpen,
  BarChart2,
  ShieldCheck,
  CheckSquare,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  LayoutGrid,
  User,
  Volume2,
  Hand,
  Settings2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { RoomContext, RoomAudioRenderer } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingDetails,
  useMeetingParticipants,
  useLeaveMeeting,
  useEndMeeting,
} from "../../hooks/useMeetings";
import { useLiveKitRoom } from "../../hooks/useLiveKitRoom";
import { useMeetingPermissions } from "../../hooks/useMeetingPermissions";
import { useMediaPreferences } from "../../hooks/useMediaPreferences";
import LiveParticipantGrid, { type MediaLayout } from "./LiveParticipantGrid";
import MeetingSettingsPanel from "./MeetingSettingsPanel";
import WhiteboardCanvas from "./WhiteboardCanvas";
import MeetingChat from "./MeetingChat";
import MeetingPolls from "./MeetingPolls";
import MeetingNotes from "./MeetingNotes";
import MeetingDecisions from "./MeetingDecisions";
import MeetingActionItems from "./MeetingActionItems";
import MeetingParticipants from "./MeetingParticipants";
import { cn } from "@/lib/utils";

interface MeetingRoomPageProps {
  meetingId: number | string;
  /** Password collected by the gate for private meetings. */
  password?: string | null;
  /** Called after the user leaves, so the caller can clear the stored session. */
  onLeave?: () => void;
}

type SideDrawerTab =
  | "people"
  | "chat"
  | "whiteboard"
  | "notes"
  | "polls"
  | "decisions"
  | "action_items"
  | "settings"
  | null;

export function MeetingRoomPage({
  meetingId,
  password: passwordProp,
  onLeave,
}: MeetingRoomPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The password can arrive either as a prop (pre-join password prompt) or as
  // a `?pwd=` query param (the "join by code" deep link) — prefer the prop.
  const pwd = passwordProp ?? searchParams.get("pwd");
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  // Owned here rather than handed in, so the in-room settings panel edits the
  // same object the session is running on.
  const { preferences, update: updatePreferences } = useMediaPreferences();

  // UI States
  const [activeSideDrawer, setActiveSideDrawer] = useState<SideDrawerTab>(null);
  const [isWhiteboardMain, setIsWhiteboardMain] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<MediaLayout>("grid");
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);
  // Browsers block autoplay of remote audio until the page has been interacted
  // with; LiveKit exposes that as `canPlaybackAudio`.
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Queries & Mutations
  const { data: meeting, isLoading, isError } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);
  const { mutate: leaveMeeting } = useLeaveMeeting();
  const { mutate: endMeeting } = useEndMeeting();
  const permissions = useMeetingPermissions(meetingId);

  // Real-time media session. `media/join` also registers us on the roster, so
  // there is no separate join call to make here.
  const {
    room,
    isConnected,
    isConnecting,
    error: mediaError,
    canPublish,
    canShareScreen,
    isMicOn,
    isCamOn,
    isScreenSharing,
    isHandRaised,
    remoteHands,
    controls,
    disconnect,
  } = useLiveKitRoom(meetingId, { password: pwd, preferences });

  // Find our participant record
  const myParticipant = participants.find(
    (p: any) => Number(p.user_id) === Number(user?.id)
  );
  const myParticipantId = myParticipant?.id;

  // Deliberately no `beforeunload` leave beacon: a reload fires it too, which
  // used to drop the user from the roster. `media/join` on mount re-registers
  // the participant, and the server prunes stale rows on its own.

  useEffect(() => {
    if (!room) return;
    const sync = () => setAudioBlocked(!room.canPlaybackAudio);
    sync();
    room.on(RoomEvent.AudioPlaybackStatusChanged, sync);
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, sync);
    };
  }, [room]);

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyCode = () => {
    if (!meeting) return;
    navigator.clipboard.writeText(meeting.meeting_code);
    toast.success("Meeting code copied!");
  };

  const handleLeave = useCallback(() => {
    if (myParticipantId) {
      leaveMeeting(myParticipantId);
    }
    // Disconnecting stops every local track and notifies the media server.
    void disconnect();
    if (onLeave) onLeave();
    else router.push("/meetings");
  }, [myParticipantId, leaveMeeting, disconnect, onLeave, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] gap-3 bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-white">
        <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Preparing meeting room...</p>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8 bg-[#0D1117] border border-[#1A2236] rounded-[16px] text-white">
        <h2 className="text-lg font-bold text-red-400">Unable to join meeting</h2>
        <p className="text-sm text-gray-400 mt-1 max-w-md">
          Please check the meeting ID or code and ensure your account has proper permissions.
        </p>
        <button
          onClick={handleLeave}
          className="mt-5 px-5 py-2 rounded-lg bg-[#161B22] text-white hover:bg-[#1E293B] transition-colors font-medium text-sm cursor-pointer"
        >
          Return to Meetings
        </button>
      </div>
    );
  }

  // Moderator powers come from the roster role, never the account role — see
  // useMeetingPermissions for the API rules this mirrors.
  const isHost = permissions.isOwner;

  // Presence is whatever LiveKit reports; the roster only supplies names and
  // roles. `room.numParticipants` excludes us, hence the +1.
  const totalPeople = room ? room.numParticipants + 1 : 1;
  const currentUserName = user?.name || "Participant";
  const startedAt = meeting.started_at
    ? new Date(meeting.started_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <RoomContext.Provider value={room ?? undefined}>
    {/* Attaches every remote audio track — without it the room is silent. */}
    {room && <RoomAudioRenderer />}
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-120px)] min-h-[640px] max-h-[980px] bg-[#0D1117] rounded-[16px] border border-[#1A2236] text-white flex flex-col justify-between overflow-hidden shadow-2xl transition-all select-none"
    >
      {/* ── Top Header (Exact Figma Match: h:49px, bg:#0D1117, border-b:#1A2236) ── */}
      <div className="h-[49px] shrink-0 bg-[#0D1117] border-b border-[#1A2236] px-4 flex items-center justify-between gap-4">
        {/* Left: Back Arrow, Title, Code, Started time, LIVE badge */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleLeave}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer shrink-0 rtl:rotate-180"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-baseline gap-2.5 truncate">
            <h1 className="text-[14px] font-bold text-white tracking-tight truncate">
              {meeting.title || "Q3 Product Review"}
            </h1>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[12px] text-[#475569] font-mono hover:text-[#25C6DA] transition-colors cursor-pointer shrink-0"
              title="Copy code"
            >
              {meeting.meeting_code || "WF-2847"}
            </button>
            <span className="text-[12px] text-[#475569] hidden md:inline truncate">
              {startedAt ? `Started ${startedAt} · ` : ""}
              {totalPeople} {totalPeople === 1 ? "person" : "people"} in the room
            </span>
          </div>

          {meeting.status === "live" && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-[10px] font-extrabold tracking-wider shrink-0">
              <span>LIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
          )}
        </div>

        {/* Right: Copy link, Fullscreen, Connected badge, People count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center rounded-lg bg-[#161B22] border border-[#1A2236] p-0.5">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              title="Grid — everyone the same size"
              className={cn(
                "h-6 px-2 rounded-md flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer",
                layout === "grid" ? "bg-[#25C6DA] text-white" : "text-[#64748B] hover:text-white"
              )}
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout("speaker")}
              title="Speaker — the person talking, large"
              className={cn(
                "h-6 px-2 rounded-md flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer",
                layout === "speaker" ? "bg-[#25C6DA] text-white" : "text-[#64748B] hover:text-white"
              )}
            >
              <User size={12} />
              <span className="hidden sm:inline">Speaker</span>
            </button>
          </div>

          {audioBlocked && (
            <button
              type="button"
              onClick={() => {
                room?.startAudio().then(() => setAudioBlocked(false)).catch(() => {});
              }}
              title="Your browser blocked meeting audio"
              className="h-7 px-2.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Volume2 size={12} />
              Enable sound
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
            title="Copy Meeting Code"
          >
            <Copy size={14} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div
            className={cn(
              "hidden sm:flex items-center justify-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold",
              isConnected
                ? "border-[rgba(34,197,94,0.3)] text-[#22C55E]"
                : isConnecting
                  ? "border-[rgba(245,158,11,0.3)] text-amber-400"
                  : "border-[rgba(239,68,68,0.3)] text-red-400"
            )}
          >
            {isConnected ? "Connected" : isConnecting ? "Connecting…" : "Offline"}
          </div>

          <div className="flex items-center gap-1 text-[12px] text-[#64748B] ps-1">
            <span className="font-semibold text-[#94A3B8]">{totalPeople}</span>
            <Users size={13} />
          </div>
        </div>
      </div>

      {/* ── Main Center Stage & Right Sidebar Container ── */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden bg-[#0D1117]">
        {/* Main Stage Video / Card Grid Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-4 sm:p-6 items-center justify-center relative">
          {mediaError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-bold text-red-400">Could not join the media room</p>
              <p className="text-xs text-gray-500 max-w-sm">{mediaError}</p>
            </div>
          ) : isWhiteboardMain ? (
            <div className="w-full h-full rounded-[16px] overflow-hidden border border-[#1E293B]">
              <WhiteboardCanvas meetingId={meeting.id} isHost={permissions.canManageWhiteboard} />
            </div>
          ) : room ? (
            /* Screen share takes over the stage inside the grid when active. */
            <LiveParticipantGrid
              roster={participants}
              remoteHands={remoteHands}
              localHandRaised={isHandRaised}
              fallbackName={currentUserName}
              meetingId={meetingId}
              layout={layout}
              pinnedIdentity={pinnedIdentity}
              onPinChange={setPinnedIdentity}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Connecting to the media room…</p>
            </div>
          )}
        </div>

        {/* ── Slide-out Collaboration Side Panel (Chat, Notes, Polls, etc.) ── */}
        {activeSideDrawer && (
          <div className="w-[340px] sm:w-[380px] bg-[#111827] border-s border-[#1A2236] h-full flex flex-col z-20 shrink-0 shadow-2xl animate-in slide-in-from-right-10 duration-200">
            {/* Panel Header */}
            <div className="h-[49px] border-b border-[#1A2236] px-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                {activeSideDrawer === "people" && <Users size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "chat" && <MessageSquare size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "notes" && <BookOpen size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "polls" && <BarChart2 size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "decisions" && <ShieldCheck size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "action_items" && <CheckSquare size={16} className="text-[#25C6DA]" />}
                {activeSideDrawer === "settings" && <Settings2 size={16} className="text-[#25C6DA]" />}
                <span>{activeSideDrawer.replace("_", " ")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeSideDrawer === "people" && (
                <MeetingParticipants meetingId={meeting.id} isHost={permissions.canInvite} />
              )}
              {activeSideDrawer === "chat" && <MeetingChat meetingId={meeting.id} />}
              {activeSideDrawer === "notes" && <MeetingNotes meetingId={meeting.id} />}
              {activeSideDrawer === "polls" && (
                <MeetingPolls meetingId={meeting.id} isHost={permissions.canManagePolls} />
              )}
              {activeSideDrawer === "decisions" && (
                <MeetingDecisions meetingId={meeting.id} isHost={isHost} />
              )}
              {activeSideDrawer === "action_items" && (
                <MeetingActionItems meetingId={meeting.id} />
              )}
              {activeSideDrawer === "settings" && (
                <MeetingSettingsPanel
                  room={room}
                  preferences={preferences}
                  update={updatePreferences}
                  controls={controls}
                  isMicOn={isMicOn}
                  isCamOn={isCamOn}
                  canPublish={canPublish}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Right Vertical Toolbar (Exact Figma Match: w:44px, bg:#0D1117, border-s:#1A2236) ── */}
        <div className="w-[44px] bg-[#0D1117] border-s border-[#1A2236] flex flex-col items-center py-3 gap-2 shrink-0 z-10 select-none">
          {/* 1. People Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "people" ? null : "people")}
            className={cn(
              "relative w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "people"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Participants"
          >
            <Users size={16} />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#25C6DA] text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
              {totalPeople}
            </span>
          </button>

          {/* 2. Chat Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "chat" ? null : "chat")}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "chat"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Chat"
          >
            <MessageSquare size={16} />
          </button>

          {/* 3. Whiteboard Toggle */}
          <button
            type="button"
            onClick={() => setIsWhiteboardMain(!isWhiteboardMain)}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              isWhiteboardMain
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Whiteboard"
          >
            <PenTool size={16} />
          </button>

          {/* 4. Notes Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "notes" ? null : "notes")}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "notes"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Notes"
          >
            <BookOpen size={16} />
          </button>

          {/* 5. Polls Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "polls" ? null : "polls")}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "polls"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Polls"
          >
            <BarChart2 size={16} />
          </button>

          {/* 6. Decisions Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "decisions" ? null : "decisions")}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "decisions"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Decisions"
          >
            <ShieldCheck size={16} />
          </button>

          {/* 7. Action Items Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "action_items" ? null : "action_items")}
            className={cn(
              "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "action_items"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Action Items"
          >
            <CheckSquare size={16} />
          </button>

          {/* 8. Settings — camera, microphone, speaker, background */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "settings" ? null : "settings")}
            className={cn(
              "mt-auto w-8 h-8 rounded-[10px] flex items-center justify-center transition-all cursor-pointer",
              activeSideDrawer === "settings"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-[#64748B] hover:text-white hover:bg-[#161B22]"
            )}
            title="Devices and background"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Bottom Control Bar (Exact Figma Match: h:69px, bg:#0D1117, border-t:#1A2236) ── */}
      <div className="h-[69px] shrink-0 bg-[#0D1117] border-t border-[#1A2236] px-4 flex items-center justify-center gap-3 relative select-none">
        {/* Center Media Controls */}
        <div className="flex items-center gap-3">
          {/* Mic Button (44x44) with real capture & speaking ring */}
          <button
            type="button"
            onClick={controls.toggleMic}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
              isMicOn
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)]"
                : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
            )}
            disabled={!isConnected || !canPublish}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera Button (44x44) with real video stream */}
          <button
            type="button"
            onClick={controls.toggleCamera}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
              isCamOn
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            disabled={!isConnected || !canPublish}
            title={isCamOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCamOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Device settings — the mic/camera pickers live in the room, so keep
              them next to the mic/camera buttons where they are looked for. */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "settings" ? null : "settings")}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              activeSideDrawer === "settings"
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            title="Devices and background"
          >
            <Settings2 size={18} />
          </button>

          {/* Screen Share Button (44x44) — publishes through LiveKit */}
          {meeting.allow_screen_share && (
          <button
            type="button"
            onClick={controls.toggleScreenShare}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
              isScreenSharing
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)] ring-2 ring-[#25C6DA]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            disabled={!isConnected || !canShareScreen}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <ScreenShare size={18} />
          </button>
          )}

          {/* Hand Raise Button (44x44) */}
          <button
            type="button"
            onClick={controls.toggleHandRaise}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
              isHandRaised
                ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            disabled={!isConnected}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand size={18} />
          </button>

          {/* Vertical Divider (w:1px, h:24px, bg:#1E293B) */}
          <div className="w-[1px] h-6 bg-[#1E293B] mx-1" />

          {/* End Meeting Button (only for host) */}
          {permissions.canEnd && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to end the meeting for everyone?")) {
                  endMeeting(meetingId, {
                    onSuccess: () => {
                      void disconnect();
                      router.push("/meetings");
                    },
                  });
                }
              }}
              className="h-10 px-5 rounded-[16px] bg-[#161B22] text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PhoneOff size={15} />
              <span>End Meeting</span>
            </button>
          )}

          {/* Leave Meeting Button (w:164px, h:40px, gradient red from Figma) */}
          <button
            type="button"
            onClick={handleLeave}
            className="h-10 px-5 rounded-[16px] bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0px_4px_14px_0px_rgba(239,68,68,0.25)] hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            <PhoneOff size={15} />
            <span>Leave Meeting</span>
          </button>
        </div>
      </div>
    </div>
    </RoomContext.Provider>
  );
}
