"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { 
  useMeetingDetails, 
  useMeetingParticipants, 
  useMeetingInvitations,
  useStartMeeting,
  useEndMeeting,
  useSendInvitation,
  useRespondInvitation,
  useUpdateParticipantRole
} from "../hooks/useMeetings";
import { 
  Video, 
  Users, 
  MessageSquare, 
  UserPlus,
  PhoneOff,
  Play,
  Send,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionModal } from "@/components/molecules/ActionModal";
import { useMeetingUserDirectory } from "../hooks/useMeetingUserDirectory";
import { useInvitableUsers } from "../hooks/useInvitableUsers";
import { useCompanyNames } from "../hooks/useCompanyNames";
import { useMeetingPermissions } from "../hooks/useMeetingPermissions";
import { useMeetingAccess } from "../hooks/useMeetingAccess";
import type { ParticipantRole } from "../types/meetings.types";

/**
 * Roles the host may hand out.
 *
 * `host` is deliberately absent: the API has no transfer-ownership route, so
 * offering it would only produce a rejected request.
 */
const ASSIGNABLE_ROLES: ParticipantRole[] = ["participant", "co_host", "viewer"];

interface MeetingDetailsPreJoinProps {
  meetingId: string | number;
  onJoin: (password?: string) => void;
}

export function MeetingDetailsPreJoin({ meetingId, onJoin }: MeetingDetailsPreJoinProps) {
  const router = useRouter();
  const t = useTranslations("meetings.details");
  const tm = useTranslations("meetings");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const { data: meeting, isLoading, isError } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);
  const { data: invitations = [] } = useMeetingInvitations(meetingId);
  
  const { mutate: startMeeting, isPending: isStarting } = useStartMeeting();
  const { mutate: endMeeting, isPending: isEnding } = useEndMeeting();
  const { mutate: sendInvite, isPending: isInviting } = useSendInvitation();
  const { mutate: respondInvitation, isPending: isResponding } = useRespondInvitation();
  const { users: invitableUsers } = useInvitableUsers(meetingId);
  const { resolveCompanyName } = useCompanyNames();
  const permissions = useMeetingPermissions(meetingId);
  const access = useMeetingAccess(meetingId);
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateParticipantRole();
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<ParticipantRole>("participant");
  // No meetingId here on purpose: chat is only readable by active participants,
  // so mining it before joining would just poll 403s.
  const { resolveName } = useMeetingUserDirectory();


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] gap-3">
        <div className="w-10 h-10 border-4 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-8">
        <h2 className="text-lg font-bold text-red-500">{t("notFound")}</h2>
        <p className="text-sm text-gray-500 mt-1">
          The meeting you are looking for does not exist or you don't have permission to view it.
        </p>
        <button
          onClick={() => router.push("/meetings")}
          className="mt-5 px-5 py-2 rounded-[8px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium text-sm cursor-pointer"
        >
          Return to Meetings
        </button>
      </div>
    );
  }

  // The API grants moderator actions by roster role or creator — not by the
  // account's role, which is what this used to assume.
  const isHost = permissions.isOwner;

  // Invitation-only. An uninvited account still sees the meeting's details —
  // the API lets it read them — but is never offered a way in.
  const isBlocked = !access.isLoading && !access.canJoin;
  const canSeeJoinButton =
    !isBlocked && meeting.status !== "ended" && meeting.status !== "cancelled";

  const renderStatusBadge = () => {
    switch (meeting.status) {
      case "waiting":
        return <span className="px-3 py-0.5 rounded-full bg-[#FFFDEB] text-[#D97706] text-xs font-bold">{tm("status.waiting")}</span>;
      case "live":
        return <span className="px-3 py-0.5 rounded-full bg-[#E6F8F9] text-[#25C6DA] text-xs font-bold animate-pulse">{tm("status.live")}</span>;
      case "ended":
        return <span className="px-3 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">{tm("status.ended")}</span>;
      case "cancelled":
        return <span className="px-3 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{tm("status.cancelled")}</span>;
      default:
        return <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold capitalize">{meeting.status}</span>;
    }
  };

  /** `accepted` -> `participants.statusAccepted`, matching the message file. */
  const inviteStatusKey = (status: string) =>
    `participants.status${String(status ?? "").charAt(0).toUpperCase()}${String(status ?? "").slice(1)}`;

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleJoinOrStart = () => {
    if (isHost && meeting.status === "waiting") {
      startMeeting(meetingId, { onSuccess: () => onJoin() });
      return;
    }
    // The device-setup screen collects the password for private meetings.
    onJoin();
  };

  const handleSendInvite = () => {
    if (!inviteUserId) return;
    sendInvite(
      { meetingId, payload: { user_id: Number(inviteUserId), role: inviteRole } },
      {
        onSuccess: () => {
          setInviteUserId("");
          // The role is a deliberate choice for the *next* invite too, so it is
          // left as the host set it rather than snapping back to Participant.
        },
      }
    );
  };

  /**
   * The role control for one roster row.
   *
   * Three rows never get a dropdown:
   *   - anyone, when the viewer is not a moderator or creator;
   *   - the viewer's own row, so a host cannot demote themselves out of the
   *     controls they are currently using;
   *   - the host's row, because there is no transfer-ownership route to call.
   */
  const renderRoleControl = (p: any) => {
    const isMe = Number(p.user_id) === Number(user?.id);

    if (!permissions.canChangeRoles || isMe || p.role === "host") {
      return (
        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">—</span>
      );
    }

    return (
      <select
        value={p.role}
        disabled={isUpdatingRole}
        onChange={(e) =>
          updateRole({
            participantId: p.id,
            participantRole: e.target.value as ParticipantRole,
            meetingId,
          })
        }
        aria-label={t("roleFor", { name: resolveName(p.user_id, tm("participants.userFallback", { id: p.user_id })) })}
        className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent px-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 outline-none focus:border-[#25C6DA] disabled:opacity-50"
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {tm(`participants.roles.${r}` as never)}
          </option>
        ))}
      </select>
    );
  };

  /**
   * Accept / Decline for one invitation.
   *
   * `useRespondInvitation` existed but had no call site anywhere in the app,
   * and the invitations table rendered a literal em-dash in its Actions
   * column — so an invitation could be sent but never answered. That also
   * left `useMeetingAccess` branching on a "declined" state nothing could
   * produce.
   */
  const renderInvitationAnswer = (invitationId: number, size: "sm" | "md" = "sm") => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isResponding}
        onClick={() => respondInvitation({ invitationId, status: "accepted" })}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[8px] bg-[#25C6DA] font-bold text-white",
          "transition-colors hover:bg-[#20b2c4] cursor-pointer disabled:opacity-50",
          size === "md" ? "px-4 py-2 text-[13px]" : "px-2.5 py-1 text-[12px]"
        )}
      >
        <Check className="w-3.5 h-3.5" />
        {t("accept")}
      </button>
      <button
        type="button"
        disabled={isResponding}
        onClick={() => respondInvitation({ invitationId, status: "declined" })}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 font-bold",
          "text-slate-500 transition-colors hover:border-[#EF4444] hover:text-[#EF4444]",
          "cursor-pointer disabled:opacity-50 dark:border-slate-700 dark:text-slate-400",
          size === "md" ? "px-4 py-2 text-[13px]" : "px-2.5 py-1 text-[12px]"
        )}
      >
        <X className="w-3.5 h-3.5" />
        {t("decline")}
      </button>
    </div>
  );

  const handleEndMeeting = () => {
    if (window.confirm(t("endConfirm"))) {
      endMeeting(meetingId);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-12">
      
      {/* Page Header (Title) */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100">
          {meeting.title}
        </h1>
        {/* Placeholder for Add Meeting button if they have it in their layout, 
            but we'll leave it up to the parent page or just render it if they want it exactly. 
            Usually this belongs to the layout, but to match the image: */}
      </div>

      {/* 1. Details Card */}
      <div className="ds-bg-form rounded-[12px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Cyan top border line */}
        <div className="h-1 w-full bg-[#25C6DA]" />
        
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("heading")}</h2>
          <div className="flex items-center gap-3">
            {renderStatusBadge()}
            <span className="text-[#25C6DA] text-[13px] font-bold tracking-wide">
              {meeting.meeting_code || `WF-${meeting.id}`}
            </span>
            
            {permissions.canEnd && (
              <button
                onClick={handleEndMeeting}
                disabled={isEnding || isStarting}
                className="px-4 py-1.5 rounded-full border border-[#EF4444] text-[#EF4444] hover:bg-red-50 font-bold text-[13px] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                {t("end")}
              </button>
            )}

            {canSeeJoinButton && (
              <button
                onClick={handleJoinOrStart}
                disabled={isStarting || isEnding}
                className={cn(
                  "px-4 py-1.5 rounded-full font-bold text-[13px] transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer",
                  isHost && meeting.status === "waiting" 
                    ? "bg-[#EF4444] hover:bg-[#DC2626] text-white" 
                    : "bg-[#25C6DA] hover:bg-[#20b2c4] text-white",
                  (isStarting || isEnding) && "opacity-50 pointer-events-none"
                )}
              >
                {isHost && meeting.status === "waiting" ? <Play className="w-3 h-3 fill-white" /> : <Video className="w-3.5 h-3.5" />}
                {isStarting ? t("starting") : isHost && meeting.status === "waiting" ? tm("startMeeting") : tm("joinMeeting")}
              </button>
            )}
          </div>
        </div>

        {/* Card Body - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 px-6 pb-6">
          {/* Col 1 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("type")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100 capitalize">{meeting.type}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("company")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                {resolveCompanyName(meeting.company_id)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("createdBy")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{meeting.creator?.name || resolveName(meeting.created_by, t("system"))}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("maxParticipants")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{meeting.max_participants || "50"}</span>
            </div>
          </div>
          {/* Col 2 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("scheduledAt")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                {meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("endedAt")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                {meeting.ended_at ? new Date(meeting.ended_at).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("peakParticipants")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{meeting.peak_participants || "0"}</span>
            </div>
          </div>
          {/* Col 3 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("privacy")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{meeting.is_private ? t("privateWithPassword") : t("public")}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("project")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{meeting.project?.title || meeting.project?.name || "—"}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("features")}</span>
              <div className="flex flex-wrap gap-1.5">
                {meeting.allow_chat && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#E6F8F9] text-[#25C6DA] text-[10px] font-bold">{t("featureChat")}</span>
                )}
                {meeting.allow_screen_share && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#E6F8F9] text-[#25C6DA] text-[10px] font-bold">{t("featureScreen")}</span>
                )}
                {meeting.allow_whiteboard && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#E6F8F9] text-[#25C6DA] text-[10px] font-bold">{t("featureWhiteboard")}</span>
                )}
                {meeting.allow_file_share && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#E6F8F9] text-[#25C6DA] text-[10px] font-bold">{t("featureFiles")}</span>
                )}
              </div>
            </div>
          </div>
          {/* Col 4 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("startedAt")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                {meeting.started_at ? new Date(meeting.started_at).toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{t("duration")}</span>
              <span className="text-[14px] font-medium text-slate-900 dark:text-slate-100">
                {meeting.duration ? t("durationMinutes", { count: meeting.duration }) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />

        {/* Description & Action */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[14px] text-slate-900 dark:text-slate-100 font-bold max-w-4xl leading-relaxed">
            {meeting.description || t("noDescription")}
          </p>
          
          <div className="flex items-center gap-3 mt-1">
            {canSeeJoinButton ? (
              <button
                onClick={handleJoinOrStart}
                disabled={isStarting || isEnding}
                className={cn(
                  "px-4 py-2 rounded-[8px] font-bold text-[13px] transition-colors shadow-sm flex items-center gap-2 cursor-pointer",
                  isHost && meeting.status === "waiting" 
                    ? "bg-[#EF4444] hover:bg-[#DC2626] text-white" 
                    : "bg-[#25C6DA] hover:bg-[#20b2c4] text-white",
                  (isStarting || isEnding) && "opacity-50 pointer-events-none"
                )}
              >
                {isHost && meeting.status === "waiting" ? <Play className="w-4 h-4 fill-white" /> : <Video className="w-4 h-4" />}
                {isStarting ? t("starting") : isHost && meeting.status === "waiting" ? tm("startMeeting") : tm("joinMeeting")}
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 rounded-[8px] bg-gray-200 text-gray-500 font-bold text-[13px] cursor-not-allowed"
              >
                {isBlocked ? t("invitationRequired") : t("meetingStatus", { status: tm(`status.${meeting.status}` as never) })}
              </button>
            )}
            <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
              {isBlocked
                ? access.reason === "declined"
                  ? t("declinedHint")
                  : t("notInvitedHint")
                : t("joinHint")}
            </span>
          </div>

          {/* The invitee arrives here from the bell, so the answer belongs
              beside the Join button and not only buried in the table below. */}
          {access.invitationStatus === "pending" && access.invitationId && (
            <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-[#25C6DA]/30 bg-[#25C6DA]/5 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  {t("invitedBanner")}
                </span>
                <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  {t("invitedBannerHint")}
                </span>
              </div>
              <div className="ms-auto">{renderInvitationAnswer(access.invitationId, "md")}</div>
            </div>
          )}

          {access.invitationStatus === "accepted" && (
            <span className="text-[12px] font-medium text-[#22C55E]">
              {t("invitationAccepted")}
            </span>
          )}
        </div>
      </div>

      {/* 2. Participants Card */}
      <div className="ds-bg-form rounded-[12px] shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">{t("participantsHeading", { count: participants.length })}</h2>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
            {t("peakOfAllowed", { peak: meeting.peak_participants || 0, max: meeting.max_participants || 50 })}
          </p>
        </div>

        <div className="w-full mt-2">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("noneJoined")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[50px]">#</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.user")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.role")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.connection")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.joined")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.left")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {participants.map((p: any, idx: number) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E6F8F9] text-[#25C6DA] flex items-center justify-center text-[11px] font-bold">
                            {getInitials(resolveName(p.user_id, `U${p.user_id}`))}
                          </div>
                          <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                            {resolveName(p.user_id, tm("participants.userFallback", { id: p.user_id }))}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {p.role ? tm(`participants.roles.${p.role}` as never) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[13px] font-medium",
                          p.connection_status === "connected" ? "text-[#22C55E]" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {tm.has(`connection.${p.connection_status}`) ? tm(`connection.${p.connection_status}` as never) : p.connection_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {p.joined_at ? new Date(p.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {p.left_at ? new Date(p.left_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {renderRoleControl(p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Invitations Card */}
      <div className="ds-bg-form rounded-[12px] shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-100">{t("invitationsHeading", { count: invitations.length })}</h2>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">
              {t("invitationsSubtitle")}
            </p>
          </div>
          {permissions.canInvite && (
            <div className="flex items-center gap-3">
              <select
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                disabled={invitableUsers.length === 0}
                className="h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent px-4 text-[13px] font-medium text-slate-500 dark:text-slate-400 outline-none focus:border-[#25C6DA] min-w-[190px] disabled:opacity-60"
              >
                <option value="">
                  {invitableUsers.length === 0
                    ? tm("participants.noneLeftToInvite")
                    : t("selectUser")}
                </option>
                {invitableUsers.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} ({u.source})
                  </option>
                ))}
              </select>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as ParticipantRole)}
                aria-label={t("inviteAsRole")}
                className="h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent px-4 text-[13px] font-medium text-slate-500 dark:text-slate-400 outline-none focus:border-[#25C6DA]"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tm(`participants.roles.${r}` as never)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSendInvite}
                disabled={!inviteUserId || isInviting}
                className="h-9 px-5 rounded-full bg-[#25C6DA] hover:bg-[#20b2c4] text-white font-bold text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 -rotate-45" />
                {isInviting ? tc("sending") : tm("participants.invite")}
              </button>
            </div>
          )}
        </div>

        <div className="w-full mt-2">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Send className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3 -rotate-45" />
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t("noInvitations")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-[50px]">#</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.user")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.invitedBy")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.status")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.sent")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {invitations.map((inv: any, idx: number) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#E6F8F9] text-[#25C6DA] flex items-center justify-center text-[11px] font-bold">
                            {getInitials(inv.user?.name || resolveName(inv.user_id, tc("unknown")))}
                          </div>
                          <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{inv.user?.name || resolveName(inv.user_id, tc("unknown"))}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {resolveName(inv.invited_by, "—")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400 ">{tm.has(inviteStatusKey(inv.status)) ? tm(inviteStatusKey(inv.status) as never) : inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-400 dark:text-slate-500">
                        {Number(inv.user_id) === Number(user?.id) && inv.status === "pending"
                          ? renderInvitationAnswer(Number(inv.id))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
