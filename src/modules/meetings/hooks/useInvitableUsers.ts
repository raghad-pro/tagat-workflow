"use client";

import { useMemo } from "react";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import { useClients } from "@/modules/clients/hooks/useClients";
import {
  useMeetingDetails,
  useMeetingParticipants,
  useMeetingInvitations,
} from "./useMeetings";
import { invitationUserId } from "../types/meetings.types";

export interface InvitableUser {
  userId: number;
  name: string;
  /** Where the row came from, shown as a hint in the picker. */
  source: "employee" | "client";
}

/**
 * Everyone the API will actually accept as an invitee for a meeting.
 *
 * The backend rejects anyone outside the meeting's company with
 * `"The selected user does not belong to this meeting's company."`, so the
 * picker must not offer them. Verified against the API:
 *   - employees whose `company_id` matches the meeting  → accepted
 *   - clients **approved** for that company             → accepted
 *   - clients that are pending or rejected              → 422
 *   - employees of any other company                    → 422
 *
 * Already-joined and already-invited users are dropped too, since re-inviting
 * them is never what the host wants.
 */
export function useInvitableUsers(meetingId: number | string) {
  const { data: meeting } = useMeetingDetails(meetingId);
  const { data: participants = [] } = useMeetingParticipants(meetingId);
  const { data: invitations = [] } = useMeetingInvitations(meetingId);
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees({ per_page: 100 });
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });

  const companyId = meeting?.company_id ?? null;

  const users = useMemo<InvitableUser[]>(() => {
    if (!companyId) return [];

    const taken = new Set<number>([
      ...participants.map((p: any) => Number(p.user_id)),
      ...invitations.flatMap((i: any) => {
        const id = invitationUserId(i);
        return id === null ? [] : [id];
      }),
    ]);

    const seen = new Set<number>();
    const result: InvitableUser[] = [];

    const push = (userId: unknown, name?: string | null, source: InvitableUser["source"] = "employee") => {
      const id = Number(userId);
      if (!Number.isFinite(id) || !name) return;
      if (taken.has(id) || seen.has(id)) return;
      seen.add(id);
      result.push({ userId: id, name, source });
    };

    (employeesData?.data ?? []).forEach((emp: any) => {
      if (Number(emp.company_id) !== Number(companyId)) return;
      push(emp.user_id ?? emp.user?.id, emp.user?.name || emp.name, "employee");
    });

    const clientRows: any[] = Array.isArray(clientsData?.data)
      ? (clientsData.data as any[])
      : ((clientsData?.data as any)?.data ?? []);

    clientRows.forEach((client: any) => {
      const link = (client.companies ?? []).find(
        (c: any) => Number(c.id) === Number(companyId)
      );
      // Only an approved link counts; pending/rejected are rejected by the API.
      const status = link?.pivot?.status ?? link?.status;
      if (status !== "approved") return;
      push(client.user_id ?? client.user?.id, client.user?.name || client.name, "client");
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [companyId, participants, invitations, employeesData, clientsData]);

  return {
    users,
    companyId,
    isLoading: loadingEmployees || loadingClients,
  };
}
