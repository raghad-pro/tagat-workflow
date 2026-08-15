"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActionModal } from "@/components/molecules/ActionModal";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import {
  useMeetingParticipants,
  useMeetingInvitations,
  useSendInvitation,
  useUpdateParticipantRole,
  useLeaveMeeting,
} from "../../hooks/useMeetings";
import type {
  MeetingParticipant,
  ParticipantRole,
  MeetingInvitation,
} from "../../types/meetings.types";
import toast from "react-hot-toast";

interface MeetingParticipantsProps {
  meetingId: number | string;
  isHost?: boolean;
}

export default function MeetingParticipants({ meetingId, isHost = false }: MeetingParticipantsProps) {
  const t = useTranslations("meetings");
  const { data: employeesData } = useEmployees({ per_page: 100 });

  const [activeTab, setActiveTab] = useState<"participants" | "invitations">("participants");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>("participant");

  const { data: participants = [] } = useMeetingParticipants(meetingId);
  const { data: invitations = [] } = useMeetingInvitations(meetingId);

  const { mutate: sendInvite, isPending: isSendingInvite } = useSendInvitation();
  const { mutate: updateRole } = useUpdateParticipantRole();
  const { mutate: leaveMeeting } = useLeaveMeeting();

  const handleSendInvite = () => {
    if (!selectedUserId) {
      toast.error("يرجى اختيار العضو أو الموظف للدعوة");
      return;
    }

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

  const getRoleLabel = (role: ParticipantRole) => {
    switch (role) {
      case "host":
        return t("participants.host");
      case "co_host":
        return t("participants.coHost");
      case "presenter":
        return t("participants.presenter");
      case "participant":
        return t("participants.participant");
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: ParticipantRole) => {
    switch (role) {
      case "host":
        return "default";
      case "co_host":
        return "secondary";
      case "presenter":
        return "outline";
      default:
        return "outline";
    }
  };

  const employees = employeesData?.data || [];

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header with Switcher Tabs */}
      <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
          <button
            onClick={() => setActiveTab("participants")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "participants"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            المشاركون ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "invitations"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            الدعوات ({invitations.length})
          </button>
        </div>

        {isHost && (
          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="h-7 gap-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>دعوة</span>
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
        {activeTab === "participants" ? (
          participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <Users className="w-10 h-10 stroke-1 mb-2 opacity-60" />
              <p className="text-sm font-medium">لا يوجد مشاركون متصلون حالياً</p>
            </div>
          ) : (
            participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {(p.user?.name || "م").charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        {p.user?.name || `مشارك #${p.user_id}`}
                      </span>
                      <Badge variant={getRoleBadgeVariant(p.role)} className="text-[10px] py-0">
                        {getRoleLabel(p.role)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          p.connection_status === "connected"
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.connection_status === "connected"
                              ? "bg-emerald-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        {p.connection_status === "connected" ? "متصل" : "غير متصل"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mic & Cam status indicators */}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {p.microphone_enabled ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5" />
                    )}
                    {p.camera_enabled ? (
                      <VideoIcon className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <VideoOff className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Role updater for Host */}
                  {isHost && (
                    <select
                      value={p.role}
                      onChange={(e) =>
                        updateRole({
                          participantId: p.id,
                          participantRole: e.target.value as ParticipantRole,
                          meetingId,
                        })
                      }
                      className="text-[11px] h-7 bg-background border rounded px-1.5 text-foreground cursor-pointer"
                    >
                      <option value="host">مضيف</option>
                      <option value="co_host">مساعد مضيف</option>
                      <option value="presenter">مُقدّم</option>
                      <option value="participant">مشارك</option>
                    </select>
                  )}
                </div>
              </div>
            ))
          )
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <Mail className="w-10 h-10 stroke-1 mb-2 opacity-60" />
            <p className="text-sm font-medium">لم يتم إرسال دعوات بعد</p>
          </div>
        ) : (
          invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {(inv.user?.name || "ع").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <span className="text-xs font-semibold text-foreground">
                    {inv.user?.name || `مستخدم #${inv.user_id}`}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {inv.user?.email || "دعوة بريدية"}
                  </p>
                </div>
              </div>

              <div>
                {inv.status === "accepted" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] py-0">
                    {t("participants.statusAccepted")}
                  </Badge>
                ) : inv.status === "declined" ? (
                  <Badge variant="destructive" className="text-[10px] py-0">
                    {t("participants.statusDeclined")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] py-0">
                    {t("participants.statusPending")}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Member Modal */}
      <ActionModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title={t("participants.inviteUser")}
        mode="add"
        saveLabel="إرسال الدعوة"
        onSubmit={handleSendInvite}
        isLoading={isSendingInvite}
        size="sm"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("participants.selectUser")}
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-primary"
            >
              <option value="">-- اختر العضو --</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.user_id || emp.id}>
                  {emp.name || emp.user?.name} ({emp.email || emp.user?.email || "موظف"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">الدور المقترح</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ParticipantRole)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-primary"
            >
              <option value="participant">مشارك (Participant)</option>
              <option value="presenter">مُقدّم (Presenter)</option>
              <option value="co_host">مساعد مضيف (Co-host)</option>
            </select>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
