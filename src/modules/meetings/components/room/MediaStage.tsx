"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  Hand,
  Users,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  Sparkles,
  Shield,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import type { Meeting, MeetingParticipant } from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MediaStageProps {
  meeting: Meeting;
  participants: MeetingParticipant[];
  onOpenWhiteboard?: () => void;
  onOpenChat?: () => void;
}

export default function MediaStage({
  meeting,
  participants = [],
  onOpenWhiteboard,
  onOpenChat,
}: MediaStageProps) {
  const t = useTranslations("meetings");
  const { user } = useAuth();

  // Local media states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Toggle Camera
  const toggleCamera = async () => {
    try {
      if (isCamOn) {
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((track) => track.stop());
        }
        setIsCamOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: isMicOn,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsCamOn(true);
      }
    } catch (err: any) {
      toast.error("تعذر تشغيل الكاميرا أو لم يتم منح الإذن");
      setIsCamOn(false);
    }
  };

  // Toggle Mic
  const toggleMic = async () => {
    try {
      if (isMicOn) {
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach((track) => track.stop());
        }
        setIsMicOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isCamOn,
        });
        streamRef.current = stream;
        setIsMicOn(true);
      }
    } catch (err: any) {
      toast.error("تعذر تشغيل الميكروفون أو لم يتم منح الإذن");
      setIsMicOn(false);
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!meeting.allow_screen_share) {
      toast.error("مشاركة الشاشة غير مسموحة في هذا الاجتماع");
      return;
    }

    try {
      if (isScreenSharing) {
        setIsScreenSharing(false);
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      }
    } catch {
      setIsScreenSharing(false);
    }
  };

  const toggleHand = () => {
    setIsHandRaised((prev) => !prev);
    toast.success(isHandRaised ? "تم خفض اليد" : "تم رفع اليد ✋");
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Compute all participants including current user
  const allUsers = [
    {
      id: user?.id || 0,
      name: (user?.name || "أنت") + " (أنت)",
      role: "host",
      isLocal: true,
      camera_enabled: isCamOn,
      microphone_enabled: isMicOn,
      hand_raised: isHandRaised,
    },
    ...participants.filter((p) => p.user_id !== user?.id).map((p) => ({
      id: p.id,
      name: p.user?.name || `مشارك #${p.user_id}`,
      role: p.role,
      isLocal: false,
      camera_enabled: p.camera_enabled,
      microphone_enabled: p.microphone_enabled,
      hand_raised: p.hand_raised,
    })),
  ];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-[560px] w-full bg-slate-950 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 select-none"
    >
      {/* Top Media Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-900/80 text-white border-slate-700 gap-1.5 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{meeting.room_name || `غرفة ${meeting.meeting_code}`}</span>
          </Badge>

          <Badge variant="outline" className="bg-slate-900/80 text-white border-slate-700 gap-1 backdrop-blur-md">
            <Users className="w-3 h-3 text-sky-400" />
            <span>{allUsers.length}</span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Video Stage Grid */}
      <div className="flex-1 p-4 pt-16 pb-24 overflow-y-auto">
        <div
          className={`grid gap-4 h-full w-full ${
            allUsers.length === 1
              ? "grid-cols-1"
              : allUsers.length <= 2
              ? "grid-cols-1 md:grid-cols-2"
              : allUsers.length <= 4
              ? "grid-cols-2"
              : "grid-cols-2 md:grid-cols-3"
          }`}
        >
          {allUsers.map((item, idx) => (
            <div
              key={item.id || idx}
              className="relative flex items-center justify-center bg-slate-900/90 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner group transition-all"
            >
              {/* Local Video Stream or Placeholder */}
              {item.isLocal && isCamOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Avatar className="w-20 h-20 border-2 border-slate-700 bg-slate-800 text-white text-xl font-bold shadow-lg">
                    <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-white">
                      {item.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-300">{item.name}</span>
                </div>
              )}

              {/* Hand raised floating badge */}
              {item.hand_raised && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                  <span>✋</span>
                  <span>مرفوعة</span>
                </div>
              )}

              {/* Participant Bottom Tag */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white/90">
                  <span>{item.name}</span>
                  {item.role === "host" && (
                    <span className="text-[10px] px-1 bg-primary/40 rounded text-primary-foreground">
                      مضيف
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-md">
                  {item.microphone_enabled ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                  {item.camera_enabled ? (
                    <VideoIcon className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl">
        {/* Mic toggle */}
        <Button
          variant={isMicOn ? "secondary" : "destructive"}
          size="icon"
          onClick={toggleMic}
          className="h-11 w-11 rounded-xl shadow transition-transform hover:scale-105"
          title={isMicOn ? "كتم الصوت" : "تشغيل الميكروفون"}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        {/* Cam toggle */}
        <Button
          variant={isCamOn ? "secondary" : "destructive"}
          size="icon"
          onClick={toggleCamera}
          className="h-11 w-11 rounded-xl shadow transition-transform hover:scale-105"
          title={isCamOn ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
        >
          {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        {/* Screen share */}
        {meeting.allow_screen_share && (
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            onClick={toggleScreenShare}
            className={`h-11 w-11 rounded-xl border-slate-700 shadow transition-transform hover:scale-105 ${
              isScreenSharing ? "bg-primary text-white" : "text-white bg-slate-800/80 hover:bg-slate-700"
            }`}
            title="مشاركة الشاشة"
          >
            <ScreenShare className="w-5 h-5" />
          </Button>
        )}

        {/* Hand raise */}
        <Button
          variant={isHandRaised ? "default" : "outline"}
          size="icon"
          onClick={toggleHand}
          className={`h-11 w-11 rounded-xl border-slate-700 shadow transition-transform hover:scale-105 ${
            isHandRaised ? "bg-amber-500 text-white" : "text-white bg-slate-800/80 hover:bg-slate-700"
          }`}
          title="رفع اليد"
        >
          <Hand className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
