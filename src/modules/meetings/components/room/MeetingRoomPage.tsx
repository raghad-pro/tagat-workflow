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
  Layout,
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

interface MeetingRoomPageProps {
  meetingId: number | string;
}

type MainViewMode = "media" | "whiteboard";
type SideTabMode = "chat" | "polls" | "notes" | "decisions" | "action_items" | "participants";

export function MeetingRoomPage({ meetingId }: MeetingRoomPageProps) {
  const t = useTranslations("meetings");
  const { user } = useAuth();

  const [mainView, setMainView] = useState<MainViewMode>("media");
  const [activeSideTab, setActiveSideTab] = useState<SideTabMode>("chat");

  const { data: meeting, isLoading, isError } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
        {/* ── Center / Left Stage Area (Cols 1 to 7 or 8) ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          {/* Main Stage Mode Switcher */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
              <button
                onClick={() => setMainView("media")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mainView === "media"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <VideoIcon className="w-4 h-4 text-primary" />
                <span>{t("roomTabs.media")}</span>
              </button>

              {meeting.allow_whiteboard && (
                <button
                  onClick={() => setMainView("whiteboard")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mainView === "whiteboard"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PenTool className="w-4 h-4 text-amber-500" />
                  <span>{t("roomTabs.whiteboard")}</span>
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
            />
          ) : (
            <WhiteboardCanvas meetingId={meeting.id} isHost={isHost} />
          )}
        </div>

        {/* ── Right Collaboration Panel (Cols 8 to 12) ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-2">
          {/* Side Tabs Navigation Bar */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border overflow-x-auto">
            <button
              onClick={() => setActiveSideTab("chat")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "chat"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.chat")}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>{t("roomTabs.chat")}</span>
            </button>

            <button
              onClick={() => setActiveSideTab("polls")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "polls"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.polls")}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t("roomTabs.polls")}</span>
            </button>

            <button
              onClick={() => setActiveSideTab("notes")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "notes"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.notes")}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              <span>{t("roomTabs.notes")}</span>
            </button>

            <button
              onClick={() => setActiveSideTab("decisions")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "decisions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.decisions")}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("roomTabs.decisions")}</span>
            </button>

            <button
              onClick={() => setActiveSideTab("action_items")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "action_items"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.actionItems")}
            >
              <CheckSquare className="w-3.5 h-3.5 text-red-500" />
              <span>{t("roomTabs.actionItems")}</span>
            </button>

            <button
              onClick={() => setActiveSideTab("participants")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activeSideTab === "participants"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={t("roomTabs.participants")}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{participants.length}</span>
            </button>
          </div>

          {/* Active Collaboration Component Container */}
          <div className="h-[600px]">
            {activeSideTab === "chat" && <MeetingChat meetingId={meeting.id} />}
            {activeSideTab === "polls" && (
              <MeetingPolls meetingId={meeting.id} isHost={isHost} />
            )}
            {activeSideTab === "notes" && <MeetingNotes meetingId={meeting.id} />}
            {activeSideTab === "decisions" && (
              <MeetingDecisions meetingId={meeting.id} isHost={isHost} />
            )}
            {activeSideTab === "action_items" && (
              <MeetingActionItems meetingId={meeting.id} />
            )}
            {activeSideTab === "participants" && (
              <MeetingParticipants meetingId={meeting.id} isHost={isHost} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
