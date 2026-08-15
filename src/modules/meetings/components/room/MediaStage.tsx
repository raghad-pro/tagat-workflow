"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Share2,
  Hand,
  PenTool,
  MessageSquare,
  Users,
  Maximize2,
  Minimize2,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { Meeting, MeetingParticipant } from "../../types/meetings.types";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface MediaStageProps {
  meeting: Meeting;
  participants: MeetingParticipant[];
  onOpenWhiteboard?: () => void;
  onOpenChat?: () => void;
  onOpenParticipants?: () => void;
}

export default function MediaStage({
  meeting,
  participants,
  onOpenWhiteboard,
  onOpenChat,
  onOpenParticipants,
}: MediaStageProps) {
  const { user } = useAuth();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const activeSpeakerName = user?.name || "Super Admin";
  const userInitials = getInitials(activeSpeakerName);

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-[620px] rounded-[16px] bg-[#111827] border border-[#1F2937] overflow-hidden shadow-2xl p-4">
      {/* ── Main Video / Tile Stage (Figma Match) ── */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* Main Active Speaker Tile */}
        <div className="relative w-full h-full max-h-[500px] rounded-[16px] bg-[#1A2236] border border-[#2A3756] flex flex-col items-center justify-center p-6 shadow-inner">
          {/* Avatar Container */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-28 h-28 rounded-full bg-[#25C6DA]/20 border-2 border-[#25C6DA] flex items-center justify-center text-[36px] font-bold text-[#25C6DA] shadow-[0_0_24px_rgba(37,198,218,0.3)] animate-in zoom-in-75">
              {userInitials}
            </div>

            {/* Hand Raised Icon Float */}
            {isHandRaised && (
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center animate-bounce shadow-md">
                <Hand className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Name & Badges from Figma */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[16px] font-bold text-white tracking-wide">
              {activeSpeakerName}
            </span>

            {/* YOU Badge */}
            <span className="px-2 py-0.5 rounded-[6px] bg-[#25C6DA]/20 text-[#25C6DA] text-[10px] font-extrabold uppercase tracking-wider">
              YOU
            </span>

            {/* HOST Badge */}
            <span className="px-2 py-0.5 rounded-[6px] bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
              HOST
            </span>
          </div>

          {/* Mic/Cam overlay indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs",
              isMicOn ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </div>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs",
              isCamOn ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {isCamOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Fullscreen Button in Stage Corner */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Bottom Control Toolbar (Figma Exact Match) ── */}
      <div className="flex items-center justify-center gap-3 pt-3 w-full flex-wrap z-10">
        {/* Microphone */}
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
            isMicOn
              ? "bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756]"
              : "bg-red-600 hover:bg-red-700 text-white"
          )}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={() => setIsCamOn(!isCamOn)}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
            isCamOn
              ? "bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756]"
              : "bg-red-600 hover:bg-red-700 text-white"
          )}
          title={isCamOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        {meeting.allow_screen_share && (
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
              isScreenSharing
                ? "bg-[#25C6DA] text-white"
                : "bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756]"
            )}
            title="Share Screen"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}

        {/* Raise Hand */}
        <button
          onClick={() => setIsHandRaised(!isHandRaised)}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md",
            isHandRaised
              ? "bg-amber-500 text-white"
              : "bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756]"
          )}
          title="Raise Hand"
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Whiteboard trigger */}
        {meeting.allow_whiteboard && onOpenWhiteboard && (
          <button
            onClick={onOpenWhiteboard}
            className="w-11 h-11 rounded-full bg-[#1A2236] hover:bg-[#25324E] text-[#25C6DA] border border-[#2A3756] flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Open Whiteboard"
          >
            <PenTool className="w-5 h-5" />
          </button>
        )}

        {/* Chat trigger */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="w-11 h-11 rounded-full bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756] flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Open Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}

        {/* Participants trigger */}
        {onOpenParticipants && (
          <button
            onClick={onOpenParticipants}
            className="w-11 h-11 rounded-full bg-[#1A2236] hover:bg-[#25324E] text-white border border-[#2A3756] flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
