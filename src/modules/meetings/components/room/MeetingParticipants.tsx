"use client";

import React, { useState } from "react";
import {
  Users,
  Mic,
  Video,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useMeetingParticipants,
  useUpdateParticipantRole,
  useSendInvitation,
  useLeaveMeeting,
} from "../../hooks/useMeetings";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import { ActionModal } from "@/components/molecules/ActionModal";
import type { ParticipantRole } from "../../types/meetings.types";

interface MeetingParticipantsProps {
  meetingId: number | string;
  isHost: boolean;
}

export default function MeetingParticipants({ meetingId, isHost }: MeetingParticipantsProps) {
  const { user } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>("participant");

  const { data: participants = [], isLoading } = useMeetingParticipants(meetingId);
  const { data: employeesData } = useEmployees({ per_page: 100 });

  const { mutate: updateRole } = useUpdateParticipantRole();
  const { mutate: sendInvite, isPending: isSendingInvite } = useSendInvitation();

  const handleRoleChange = (participantId: number | string, newRole: ParticipantRole) => {
    updateRole({ participantId, participantRole: newRole, meetingId });
  };

  const handleSendInvite = () => {
    if (!selectedUserId) return;
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

  const employees = employeesData?.data || [];

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full rounded-[14px] bg-[#111827] border border-[#1F2937] overflow-hidden text-white">
      {/* ── Top Header matching Figma (people) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#111827]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#25C6DA]" />
          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B]">
            people ({participants.length})
          </span>
        </div>

        {isHost && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#25C6DA] hover:bg-[#20b2c4] text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        )}
      </div>

      {/* ── Participants List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#25C6DA]/20 border-t-[#25C6DA] rounded-full animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            No participants yet.
          </div>
        ) : (
          participants.map((p) => {
            const isMe = p.user_id === user?.id;
            const displayName = p.user?.name || "Participant";
            const initials = getInitials(displayName);
            const isParticipantHost = p.role === "host" || p.role === "co_host";

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#1A2236] border border-[#2A3756]/50 hover:border-[#25C6DA]/40 transition-colors"
              >
                {/* Left info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#25C6DA]/20 text-[#25C6DA] flex items-center justify-center font-bold text-xs shrink-0 border border-[#25C6DA]/40">
                    {initials}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-bold text-white leading-tight">
                        {displayName}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded bg-[#25C6DA]/20 text-[#25C6DA] text-[9px] font-extrabold">
                          YOU
                        </span>
                      )}
                      {isParticipantHost && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-extrabold">
                          host
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#94A3B8] font-medium">
                      {p.role}
                    </span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-black/40 text-emerald-400 flex items-center justify-center text-[10px]">
                      <Mic className="w-3 h-3" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-black/40 text-emerald-400 flex items-center justify-center text-[10px]">
                      <Video className="w-3 h-3" />
                    </div>
                  </div>

                  {isHost && !isMe && (
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as ParticipantRole)}
                      className="bg-[#111827] text-white border border-[#2A3756] text-[10px] rounded px-1.5 py-1 focus:outline-none focus:border-[#25C6DA]"
                    >
                      <option value="participant">Participant</option>
                      <option value="presenter">Presenter</option>
                      <option value="co_host">Co-Host</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Member Modal */}
      <ActionModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Member"
        mode="add"
        saveLabel="Send Invite"
        onSubmit={handleSendInvite}
        isLoading={isSendingInvite}
        size="sm"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Select Member</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Choose employee/user...</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.user_id || emp.id}>
                  {emp.name || emp.user?.name || `User #${emp.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Room Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ParticipantRole)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="participant">Participant</option>
              <option value="presenter">Presenter</option>
              <option value="co_host">Co-Host</option>
            </select>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
