"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Video,
  Copy,
  Clock,
  Radio,
  Play,
  Square,
  LogOut,
  Lock,
  Users,
  Folder,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { useStartMeeting, useEndMeeting } from "../../hooks/useMeetings";
import type { Meeting } from "../../types/meetings.types";

interface MeetingHeaderProps {
  meeting: Meeting;
  isHost?: boolean;
}

export default function MeetingHeader({ meeting, isHost = false }: MeetingHeaderProps) {
  const t = useTranslations("meetings");
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || "employee";

  const { mutate: startMeeting, isPending: isStarting } = useStartMeeting();
  const { mutate: endMeeting, isPending: isEnding } = useEndMeeting();

  // Elapsed timer for in_progress meetings
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (meeting.status === "in_progress") {
      const startTime = meeting.started_at
        ? new Date(meeting.started_at).getTime()
        : new Date(meeting.updated_at || Date.now()).getTime();

      const updateElapsed = () => {
        const now = Date.now();
        const diffInSec = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diffInSec);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [meeting.status, meeting.started_at, meeting.updated_at]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meeting.meeting_code);
    toast.success(t("codeCopied"));
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border rounded-xl shadow-sm">
      {/* Title & Metadata */}
      <div className="flex items-center gap-3">
        <Link href="/meetings">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
            <ArrowRight className="w-5 h-5 rtl:rotate-0 ltr:rotate-180" />
          </Button>
        </Link>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-foreground">{meeting.title}</h1>
            {meeting.is_private && (
              <Badge variant="outline" className="text-xs gap-1 py-0 bg-muted/50">
                <Lock className="w-3 h-3" />
                <span>خاص</span>
              </Badge>
            )}
            {meeting.project && (
              <Badge variant="secondary" className="text-xs gap-1 py-0">
                <Folder className="w-3 h-3" />
                <span>{meeting.project.name || meeting.project.title}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {/* Meeting code */}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 hover:text-primary font-mono font-medium transition-colors"
              title={t("copyCode")}
            >
              <span>{meeting.meeting_code}</span>
              <Copy className="w-3 h-3" />
            </button>

            {/* Status & Timer */}
            {meeting.status === "in_progress" ? (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{t("status.in_progress")}</span>
                <span className="font-mono bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t(`status.${meeting.status}`)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end md:self-center">
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
          <Copy className="w-3.5 h-3.5" />
          <span>{t("copyLink")}</span>
        </Button>

        {/* Start button for host if waiting */}
        {isHost && meeting.status === "waiting" && (
          <Button
            size="sm"
            onClick={() => startMeeting(meeting.id)}
            disabled={isStarting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t("startMeeting")}</span>
          </Button>
        )}

        {/* End button for host if in_progress */}
        {isHost && meeting.status === "in_progress" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => endMeeting(meeting.id)}
            disabled={isEnding}
            className="gap-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t("endMeeting")}</span>
          </Button>
        )}

        {/* Leave Room button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/meetings")}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t("leaveMeeting")}</span>
        </Button>
      </div>
    </div>
  );
}
