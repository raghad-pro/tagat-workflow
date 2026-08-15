"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Video as VideoIcon,
  PenTool,
  MessageSquare,
  BarChart2,
  BookOpen,
  ShieldCheck,
  CheckSquare,
  Users,
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { useMeetingDetails, useMeetingParticipants } from "../../hooks/useMeetings";
import MeetingHeader from "./MeetingHeader";
import MediaStage from "./MediaStage";
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

type MainViewMode = "media" | "whiteboard";
type SideTabMode = "people" | "chat" | "notes" | "polls" | "decisions" | "action_items";

export function MeetingRoomPage({ meetingId }: MeetingRoomPageProps) {
  const t = useTranslations("meetings");
  const { user } = useAuth();

  const [mainView, setMainView] = useState<MainViewMode>("media");
  const [activeSideTab, setActiveSideTab] = useState<SideTabMode>("people");

  const { data: meeting, isLoading, isError } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">جاري تجهيز غرفة الاجتماع...</p>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-card border rounded-2xl">
        <h2 className="text-lg font-bold text-destructive">تعذّر الدخول لغرفة الاجتماع</h2>
        <p className="text-sm text-muted-foreground mt-1">
          تأكد من صحة كود أو معرف الاجتماع وصلاحيات الحساب للدخول.
        </p>
      </div>
    );
  }

  const isHost =
    meeting.created_by === user?.id ||
    user?.role === "super_admin" ||
    user?.role === "company";

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* ── Top Meeting Header ── */}
      <MeetingHeader meeting={meeting} isHost={isHost} />

      {/* ── Main Workspace Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── Center / Left Stage Area (Cols 1 to 8) ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          {/* Main Stage Mode Switcher */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-[12px] border border-[#1F2937]">
              <button
                onClick={() => setMainView("media")}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer",
                  mainView === "media"
                    ? "bg-[#25C6DA] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-white"
                )}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>Media Stage</span>
              </button>

              {meeting.allow_whiteboard && (
                <button
                  onClick={() => setMainView("whiteboard")}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-[8px] transition-all cursor-pointer",
                    mainView === "whiteboard"
                      ? "bg-[#25C6DA] text-white shadow-sm"
                      : "text-[#94A3B8] hover:text-white"
                  )}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Whiteboard</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Center Stage View */}
          {mainView === "media" ? (
            <MediaStage
              meeting={meeting}
              participants={participants}
              onOpenWhiteboard={() => setMainView("whiteboard")}
              onOpenChat={() => setActiveSideTab("chat")}
              onOpenParticipants={() => setActiveSideTab("people")}
            />
          ) : (
            <div className="h-[620px]">
              <WhiteboardCanvas meetingId={meeting.id} isHost={isHost} />
            </div>
          )}
        </div>

        {/* ── Right Collaboration Panel (Cols 8 to 12) ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-2">
          {/* Side Tabs Navigation Bar matching Figma */}
          <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-[12px] border border-[#1F2937] overflow-x-auto">
            <button
              onClick={() => setActiveSideTab("people")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "people"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>people</span>
            </button>

            <button
              onClick={() => setActiveSideTab("chat")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "chat"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>chat</span>
            </button>

            <button
              onClick={() => setActiveSideTab("notes")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "notes"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>notes</span>
            </button>

            <button
              onClick={() => setActiveSideTab("polls")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "polls"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>polls</span>
            </button>

            <button
              onClick={() => setActiveSideTab("decisions")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "decisions"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>decisions</span>
            </button>

            <button
              onClick={() => setActiveSideTab("action_items")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase rounded-[8px] shrink-0 transition-all cursor-pointer",
                activeSideTab === "action_items"
                  ? "bg-[#25C6DA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-white"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>actions</span>
            </button>
          </div>

          {/* Active Collaboration Component Container */}
          <div className="h-[620px]">
            {activeSideTab === "people" && (
              <MeetingParticipants meetingId={meeting.id} isHost={isHost} />
            )}
            {activeSideTab === "chat" && <MeetingChat meetingId={meeting.id} />}
            {activeSideTab === "notes" && <MeetingNotes meetingId={meeting.id} />}
            {activeSideTab === "polls" && (
              <MeetingPolls meetingId={meeting.id} isHost={isHost} />
            )}
            {activeSideTab === "decisions" && (
              <MeetingDecisions meetingId={meeting.id} isHost={isHost} />
            )}
            {activeSideTab === "action_items" && (
              <MeetingActionItems meetingId={meeting.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
