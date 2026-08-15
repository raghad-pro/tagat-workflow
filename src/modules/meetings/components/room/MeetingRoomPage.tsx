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
  Hand,
  Settings,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingDetails,
  useMeetingParticipants,
  useJoinMeeting,
  useLeaveMeeting,
  useEndMeeting,
} from "../../hooks/useMeetings";
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
}

type SideDrawerTab =
  | "people"
  | "chat"
  | "whiteboard"
  | "notes"
  | "polls"
  | "decisions"
  | "action_items"
  | null;

interface PeerState {
  userId: number;
  name: string;
  isMicOn: boolean;
  isCamOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  lastSeen: number;
}

export function MeetingRoomPage({ meetingId }: MeetingRoomPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pwd = searchParams.get("pwd");
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // UI States
  const [activeSideDrawer, setActiveSideDrawer] = useState<SideDrawerTab>(null);
  const [isWhiteboardMain, setIsWhiteboardMain] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peersState, setPeersState] = useState<Record<number, PeerState>>({});

  // Media Streams refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Queries & Mutations
  const { data: meeting, isLoading, isError } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);
  const { mutate: joinMeeting } = useJoinMeeting();
  const { mutate: leaveMeeting } = useLeaveMeeting();
  const { mutate: endMeeting } = useEndMeeting();

  // Find our participant record
  const myParticipant = participants.find((p: any) => p.user_id === user?.id);
  const myParticipantId = myParticipant?.id;

  // 1. Auto-Join Meeting on mount
  useEffect(() => {
    if (meetingId) {
      joinMeeting({
        meetingId,
        payload: pwd ? { password: pwd } : undefined,
      });
    }
  }, [meetingId, joinMeeting, pwd]);

  // 2. Broadcast Channel for real-time peer state synchronization across tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const channelName = `tagat_meeting_${meetingId}`;
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.userId || data.userId === user?.id) return;

        if (data.type === "peer_update") {
          setPeersState((prev) => ({
            ...prev,
            [data.userId]: {
              userId: data.userId,
              name: data.name || "Participant",
              isMicOn: Boolean(data.isMicOn),
              isCamOn: Boolean(data.isCamOn),
              isHandRaised: Boolean(data.isHandRaised),
              isScreenSharing: Boolean(data.isScreenSharing),
              lastSeen: Date.now(),
            },
          }));
        } else if (data.type === "peer_leave") {
          setPeersState((prev) => {
            const next = { ...prev };
            delete next[data.userId];
            return next;
          });
        }
      };

      // Announce arrival
      channel.postMessage({
        type: "peer_update",
        userId: user?.id || 1,
        name: user?.name || "Participant",
        isMicOn,
        isCamOn,
        isHandRaised,
        isScreenSharing,
      });

      return () => {
        channel.postMessage({
          type: "peer_leave",
          userId: user?.id || 1,
        });
        channel.close();
      };
    } catch {
      // BroadcastChannel not supported in some test envs
    }
  }, [meetingId, user?.id, user?.name]);

  // 3. Periodic Heartbeat Ping & Stale Peer Pruning (Every 2.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (broadcastChannelRef.current && user?.id) {
        broadcastChannelRef.current.postMessage({
          type: "peer_update",
          userId: user.id,
          name: user.name || "Participant",
          isMicOn,
          isCamOn,
          isHandRaised,
          isScreenSharing,
        });
      }

      // Prune stale peers (> 6s since last ping)
      const now = Date.now();
      setPeersState((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const [idStr, peer] of Object.entries(updated)) {
          if (now - peer.lastSeen > 6000) {
            delete updated[Number(idStr)];
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [user?.id, user?.name, isMicOn, isCamOn, isHandRaised, isScreenSharing]);

  // 4. Handle Window Close / Unload Event
  useEffect(() => {
    const onUnload = () => {
      if (broadcastChannelRef.current && user?.id) {
        broadcastChannelRef.current.postMessage({
          type: "peer_leave",
          userId: user.id,
        });
      }
      if (myParticipantId) {
        const prefix = user?.role ? `/${user.role}` : "/employee";
        const leaveUrl = `/backend-api${prefix}/meeting-participants/${myParticipantId}/leave`;
        navigator.sendBeacon?.(leaveUrl);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [myParticipantId, user?.id, user?.role]);

  // Broadcast our local changes
  const broadcastMyState = useCallback(
    (updates: Partial<{ isMicOn: boolean; isCamOn: boolean; isHandRaised: boolean; isScreenSharing: boolean }>) => {
      if (broadcastChannelRef.current && user?.id) {
        broadcastChannelRef.current.postMessage({
          type: "peer_update",
          userId: user.id,
          name: user.name || "Participant",
          isMicOn: updates.isMicOn !== undefined ? updates.isMicOn : isMicOn,
          isCamOn: updates.isCamOn !== undefined ? updates.isCamOn : isCamOn,
          isHandRaised: updates.isHandRaised !== undefined ? updates.isHandRaised : isHandRaised,
          isScreenSharing: updates.isScreenSharing !== undefined ? updates.isScreenSharing : isScreenSharing,
        });
      }
    },
    [user?.id, user?.name, isMicOn, isCamOn, isHandRaised, isScreenSharing]
  );

  // 3. Audio & Mic Processing
  const startAudioProcessing = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setIsSpeaking(avg > 18);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch {
      // Ignore audio context initialization error if blocked
    }
  };

  // Toggle Microphone
  const toggleMic = async () => {
    try {
      const nextMicState = !isMicOn;
      if (nextMicState) {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          startAudioProcessing(stream);
        } else {
          localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        setIsMicOn(true);
        toast.success("Microphone enabled");
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        setIsMicOn(false);
        setIsSpeaking(false);
        toast.success("Microphone muted");
      }
      broadcastMyState({ isMicOn: nextMicState });
    } catch (err: any) {
      toast.error("Could not access microphone: " + (err?.message || "Permission denied"));
      setIsMicOn(false);
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    try {
      const nextCamState = !isCamOn;
      if (nextCamState) {
        let stream = localStreamRef.current;
        if (!stream || stream.getVideoTracks().length === 0) {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 360 } },
            audio: isMicOn,
          });
          localStreamRef.current = newStream;
          stream = newStream;
          if (isMicOn) startAudioProcessing(newStream);
        } else {
          stream.getVideoTracks().forEach((t) => (t.enabled = true));
        }

        setIsCamOn(true);
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        toast.success("Camera turned on");
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = false));
        }
        setIsCamOn(false);
        toast.success("Camera turned off");
      }
      broadcastMyState({ isCamOn: nextCamState });
    } catch (err: any) {
      toast.error("Could not access camera: " + (err?.message || "Permission denied"));
      setIsCamOn(false);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          broadcastMyState({ isScreenSharing: false });
        };
        toast.success("Screen sharing started");
        broadcastMyState({ isScreenSharing: true });
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
        broadcastMyState({ isScreenSharing: false });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Screen share error: " + (err?.message || "Permission denied"));
      }
      setIsScreenSharing(false);
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    broadcastMyState({ isHandRaised: next });
    toast.success(next ? "Hand raised" : "Hand lowered");
  };

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
    // 1. Call backend leave API
    if (myParticipantId) {
      leaveMeeting(myParticipantId);
    }
    // 2. Broadcast leave to other tabs/browsers immediately
    if (broadcastChannelRef.current && user?.id) {
      broadcastChannelRef.current.postMessage({
        type: "peer_leave",
        userId: user.id,
      });
    }
    // 3. Cleanup media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    router.push("/meetings");
  }, [myParticipantId, leaveMeeting, user?.id, router]);

  // Helper for initials
  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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

  const isHost =
    meeting.created_by === user?.id ||
    user?.role === "super_admin" ||
    user?.role === "company";

  // Filter only active connected participants who haven't left
  const activeDbParticipants = (participants || []).filter(
    (p: any) =>
      (!p.left_at || p.left_at === null) &&
      p.connection_status !== "disconnected" &&
      p.connection_status !== "idle" &&
      p.user_id !== user?.id
  );

  // Merge with real-time broadcasting peers
  const dbUserIds = new Set(activeDbParticipants.map((p: any) => p.user_id));
  const additionalPeers = Object.values(peersState).filter(
    (peer) => peer.userId !== user?.id && !dbUserIds.has(peer.userId)
  );

  const uniqueParticipants = [
    ...activeDbParticipants,
    ...additionalPeers.map((bp) => ({
      id: bp.userId,
      user_id: bp.userId,
      name: bp.name,
      role: "participant",
      connection_status: "connected",
    })),
  ];

  const totalPeople = Math.max(1, uniqueParticipants.length + 1);
  const currentUserName = user?.name || "Super Admin";
  const userInitials = getInitials(currentUserName);

  return (
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
              Started 06:51 · {totalPeople} {totalPeople === 1 ? "person" : "people"} in the room
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-[10px] font-extrabold tracking-wider shrink-0">
            <span>LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          </div>
        </div>

        {/* Right: Copy link, Fullscreen, Connected badge, People count */}
        <div className="flex items-center gap-2.5 shrink-0">
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

          <div className="hidden sm:flex items-center justify-center px-2.5 py-0.5 rounded-full border border-[rgba(34,197,94,0.3)] text-[#22C55E] text-[10px] font-bold">
            Connected
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
          {/* Active Screen Share View (if active) */}
          {isScreenSharing ? (
            <div className="w-full h-full max-w-5xl rounded-[16px] overflow-hidden border border-[#25C6DA]/50 shadow-2xl relative bg-black flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-bold text-[#25C6DA] flex items-center gap-2">
                <ScreenShare size={14} />
                <span>You are sharing your screen</span>
              </div>
            </div>
          ) : isWhiteboardMain ? (
            <div className="w-full h-full rounded-[16px] overflow-hidden border border-[#1E293B]">
              <WhiteboardCanvas meetingId={meeting.id} isHost={isHost} />
            </div>
          ) : (
            /* Video/Participant Tiles Container matching Figma (w:318px h:179px per card) */
            <div className="flex items-center justify-center flex-wrap gap-4 w-full max-w-4xl">
              {/* Active User Tile (Figma Match) */}
              <div
                className={cn(
                  "relative w-[318px] h-[179px] bg-[#161B22] border rounded-[16px] p-2.5 flex flex-col justify-between items-center shadow-lg transition-all group select-none overflow-hidden",
                  isSpeaking
                    ? "border-[#22C55E] ring-2 ring-[#22C55E]/40"
                    : "border-[#1E293B]/80 hover:border-[#25C6DA]/40"
                )}
                style={{
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Live Camera Video Stream if active */}
                {isCamOn && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-[16px] z-0 scale-x-[-1]"
                  />
                )}

                {/* Top Tile Row: Mic status & hand */}
                <div className="w-full flex items-center justify-between px-1 z-10">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors",
                      isMicOn
                        ? isSpeaking
                          ? "bg-[#22C55E] text-white shadow-sm"
                          : "bg-[#25C6DA]/20 text-[#25C6DA]"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {isMicOn ? <Mic size={12} /> : <MicOff size={12} />}
                  </div>

                  {isHandRaised && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center animate-bounce shadow-sm">
                      <Hand size={12} />
                    </div>
                  )}
                </div>

                {/* Center: Avatar Circle when camera is off */}
                {!isCamOn && (
                  <div className="flex items-center justify-center my-auto z-10">
                    <div
                      className={cn(
                        "w-[64px] h-[64px] rounded-full text-white flex items-center justify-center text-[20px] font-bold shadow-[0_4px_14px_rgba(37,198,218,0.4)] transition-all",
                        isSpeaking
                          ? "bg-[#22C55E] ring-4 ring-[#22C55E]/30"
                          : "bg-[#25C6DA]"
                      )}
                    >
                      {userInitials}
                    </div>
                  </div>
                )}

                {/* Bottom Badges Row (Super Admin, YOU, HOST) */}
                <div className="flex items-center gap-1.5 self-start z-10 mt-auto">
                  <span className="px-2 py-0.5 rounded-[10px] bg-black/60 text-white text-[11px] font-semibold leading-tight backdrop-blur-xs">
                    {currentUserName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(37,198,218,0.8)] text-white text-[9px] font-bold leading-tight">
                    YOU
                  </span>
                  {isHost && (
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(245,158,11,0.8)] text-white text-[9px] font-bold leading-tight">
                      HOST
                    </span>
                  )}
                </div>
              </div>

              {/* Extra participants cards */}
              {uniqueParticipants.map((p: any) => {
                const peerData = peersState[p.user_id || p.id];
                const pName = p.name || p.user?.name || "Participant";
                const pInitials = getInitials(pName);
                const pMicOn = peerData?.isMicOn ?? true;
                const pHandRaised = peerData?.isHandRaised ?? false;

                return (
                  <div
                    key={p.id}
                    className="relative w-[318px] h-[179px] bg-[#161B22] border border-[#1E293B]/80 rounded-[16px] p-2.5 flex flex-col justify-between items-center shadow-lg select-none"
                  >
                    <div className="w-full flex items-center justify-between px-1 z-10">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          pMicOn ? "bg-[#25C6DA]/20 text-[#25C6DA]" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {pMicOn ? <Mic size={12} /> : <MicOff size={12} />}
                      </div>

                      {pHandRaised && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center animate-bounce shadow-sm">
                          <Hand size={12} />
                        </div>
                      )}
                    </div>

                    <div className="w-[64px] h-[64px] rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-[20px] font-bold my-auto shadow-md">
                      {pInitials}
                    </div>

                    <div className="flex items-center gap-1.5 self-start z-10">
                      <span className="px-2 py-0.5 rounded-[10px] bg-black/60 text-white text-[11px] font-semibold leading-tight">
                        {pName}
                      </span>
                      {p.role === "host" && (
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[rgba(245,158,11,0.8)] text-white text-[9px] font-bold leading-tight">
                          HOST
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
                <MeetingParticipants meetingId={meeting.id} isHost={isHost} />
              )}
              {activeSideDrawer === "chat" && <MeetingChat meetingId={meeting.id} />}
              {activeSideDrawer === "notes" && <MeetingNotes meetingId={meeting.id} />}
              {activeSideDrawer === "polls" && (
                <MeetingPolls meetingId={meeting.id} isHost={isHost} />
              )}
              {activeSideDrawer === "decisions" && (
                <MeetingDecisions meetingId={meeting.id} isHost={isHost} />
              )}
              {activeSideDrawer === "action_items" && (
                <MeetingActionItems meetingId={meeting.id} />
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
        </div>
      </div>

      {/* ── Bottom Control Bar (Exact Figma Match: h:69px, bg:#0D1117, border-t:#1A2236) ── */}
      <div className="h-[69px] shrink-0 bg-[#0D1117] border-t border-[#1A2236] px-4 flex items-center justify-center gap-3 relative select-none">
        {/* Center Media Controls */}
        <div className="flex items-center gap-3">
          {/* Mic Button (44x44) with real capture & speaking ring */}
          <button
            type="button"
            onClick={toggleMic}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              isMicOn
                ? isSpeaking
                  ? "bg-[#22C55E] text-white ring-4 ring-[#22C55E]/40 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  : "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)]"
                : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
            )}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera Button (44x44) with real video stream */}
          <button
            type="button"
            onClick={toggleCamera}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              isCamOn
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            title={isCamOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCamOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Screen Share Button (44x44) with real getDisplayMedia */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              isScreenSharing
                ? "bg-[#25C6DA] text-white shadow-[0_0_12px_rgba(37,198,218,0.4)] ring-2 ring-[#25C6DA]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <ScreenShare size={18} />
          </button>

          {/* Hand Raise Button (44x44) */}
          <button
            type="button"
            onClick={toggleHandRaise}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              isHandRaised
                ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                : "bg-[#161B22] text-white border border-[#1E293B] hover:bg-[#1E293B]"
            )}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand size={18} />
          </button>

          {/* Vertical Divider (w:1px, h:24px, bg:#1E293B) */}
          <div className="w-[1px] h-6 bg-[#1E293B] mx-1" />

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
  );
}
