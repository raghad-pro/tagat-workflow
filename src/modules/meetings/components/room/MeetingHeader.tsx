"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  PhoneOff,
  Radio,
  Clock,
  Lock,
  Play,
  Square,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Meeting } from "../../types/meetings.types";
import { useStartMeeting, useEndMeeting } from "../../hooks/useMeetings";
import { cn } from "@/lib/utils";

interface MeetingHeaderProps {
  meeting: Meeting;
  isHost: boolean;
}

export default function MeetingHeader({ meeting, isHost }: MeetingHeaderProps) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { mutate: startMeeting, isPending: isStarting } = useStartMeeting();
  const { mutate: endMeeting, isPending: isEnding } = useEndMeeting();

  const isLive = meeting.status === "in_progress";

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meeting.meeting_code);
    toast.success("تم نسخ كود الاجتماع!");
  };

  const handleLeave = () => {
    router.push("/meetings");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[14px] bg-[#111827] text-white border border-[#1F2937] shadow-lg">
      {/* Title & Live Status */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <div className="w-10 h-10 rounded-[10px] bg-[#1A2236] flex items-center justify-center text-[#25C6DA] shrink-0 border border-[#1F2937]">
          <Radio className={cn("w-5 h-5", isLive && "animate-pulse")} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] font-bold tracking-tight text-white">
              {meeting.title}
            </h1>
            {meeting.is_private && (
              <span className="p-1 rounded bg-[#1A2236] text-[#94A3B8]">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#94A3B8] font-medium mt-0.5">
            {/* Meeting Code button */}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A2236] hover:bg-[#222F4C] text-[#25C6DA] font-mono transition-colors group cursor-pointer"
            >
              <span>{meeting.meeting_code}</span>
              <Copy className="w-3 h-3 text-[#94A3B8] group-hover:text-[#25C6DA]" />
            </button>

            {/* Live Indicator */}
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7EE]/15 text-[#4CAF50] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-ping" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A2236] text-[#D97706]">
                <Clock className="w-3 h-3" />
                {meeting.status}
              </span>
            )}

            {/* Timer */}
            {isLive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A2236] text-white font-mono">
                {formatTimer(elapsedSeconds)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {isHost && !isLive && meeting.status !== "ended" && (
          <button
            onClick={() => startMeeting(meeting.id)}
            disabled={isStarting}
            className="flex items-center gap-1.5 px-4 h-[36px] rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[13px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Meeting</span>
          </button>
        )}

        {isHost && isLive && (
          <button
            onClick={() => endMeeting(meeting.id)}
            disabled={isEnding}
            className="flex items-center gap-1.5 px-4 h-[36px] rounded-[8px] bg-red-600/90 hover:bg-red-700 text-white text-[13px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>End Meeting</span>
          </button>
        )}

        {/* Leave Meeting matching Figma button */}
        <button
          onClick={handleLeave}
          className="flex items-center gap-1.5 px-4 h-[36px] rounded-[8px] bg-[#FEECEB] hover:bg-red-100 text-[#F44336] text-[13px] font-bold transition-colors cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Meeting</span>
        </button>
      </div>
    </div>
  );
}
