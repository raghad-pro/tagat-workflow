import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { meetingsApi } from "../api/meetings.api";
import type {
  MeetingFilters,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  SendInvitationPayload,
  InvitationStatus,
  ParticipantRole,
  JoinMeetingPayload,
  CreatePollPayload,
  VotePollPayload,
  WhiteboardElement,
  CreateNotePayload,
  UpdateNotePayload,
  CreateDecisionPayload,
  CreateActionItemPayload,
  ConvertToTaskPayload,
} from "../types/meetings.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const MEETINGS_QUERY_KEYS = {
  all: ["meetings"] as const,
  list: (role: string, filters?: MeetingFilters) => ["meetings", "list", role, filters] as const,
  detail: (role: string, id: number | string) => ["meetings", "detail", role, String(id)] as const,
  invitations: (role: string, meetingId: number | string) => ["meetings", "invitations", role, String(meetingId)] as const,
  participants: (role: string, meetingId: number | string) => ["meetings", "participants", role, String(meetingId)] as const,
  messages: (role: string, meetingId: number | string) => ["meetings", "messages", role, String(meetingId)] as const,
  polls: (role: string, meetingId: number | string) => ["meetings", "polls", role, String(meetingId)] as const,
  whiteboard: (role: string, meetingId: number | string) => ["meetings", "whiteboard", role, String(meetingId)] as const,
  notes: (role: string, meetingId: number | string) => ["meetings", "notes", role, String(meetingId)] as const,
  decisions: (role: string, meetingId: number | string, status?: string) => ["meetings", "decisions", role, String(meetingId), status] as const,
  actionItems: (role: string, meetingId: number | string, filters?: any) => ["meetings", "actionItems", role, String(meetingId), filters] as const,
};

// ─── Meetings List & Details ──────────────────────────────────────────────────
export function useMeetings(filters?: MeetingFilters) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.list(role, filters),
    queryFn: () => meetingsApi.getAll(role, filters),
    staleTime: 30000,
  });
}

export function useMeetingDetails(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.detail(role, meetingId),
    queryFn: () => meetingsApi.getById(role, meetingId),
    enabled: Boolean(meetingId),
    staleTime: 10000,
  });
}

// ─── Meeting Mutations ────────────────────────────────────────────────────────
export function useCreateMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) => meetingsApi.create(role, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success(tt("createSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("createError"));
    },
  });
}

export function useUpdateMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateMeetingPayload }) =>
      meetingsApi.update(role, id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success(tt("updateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("updateError"));
    },
  });
}

export function useDeleteMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success(tt("deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("deleteError"));
    },
  });
}

export function useStartMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.start(role, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success(tt("startSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("startError"));
    },
  });
}

export function useEndMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.end(role, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success(tt("endSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("endError"));
    },
  });
}

/**
 * The clearest sentence the API gave us about a failed invite.
 *
 * The response interceptor already lifts `data.message` onto `error.message`,
 * but a 422 carries the useful detail in `errors` — "The selected user does not
 * belong to this meeting's company." lives there, while `message` is often the
 * generic "The given data was invalid."
 */
function invitationError(err: any, fallback: string): string {
  const firstFieldError = Object.values(
    (err?.response?.data?.errors ?? {}) as Record<string, string[]>
  )[0]?.[0];
  return firstFieldError || err?.response?.data?.message || err?.message || fallback;
}

// ─── Invitations Hooks ────────────────────────────────────────────────────────
export function useMeetingInvitations(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.invitations(role, meetingId),
    queryFn: () => meetingsApi.getInvitations(role, meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useSendInvitation() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: SendInvitationPayload }) =>
      meetingsApi.sendInvitation(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.invitations(role, meetingId) });
      // The room gate reads the invitation list, so a fresh invite has to reach
      // the invitee's cache too — not just the host's own view.
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success(tt("inviteSuccess"));
    },
    onError: (err: any) => {
      toast.error(invitationError(err, tt("inviteError")));
    },
  });
}

export function useRespondInvitation() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: number | string; status: InvitationStatus }) =>
      meetingsApi.respondInvitation(role, invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success(tt("respondSuccess"));
    },
    onError: (err: any) => {
      toast.error(invitationError(err, tt("respondError")));
    },
  });
}

// ─── Participants Hooks ───────────────────────────────────────────────────────
export function useMeetingParticipants(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.participants(role, meetingId),
    queryFn: () => meetingsApi.getParticipants(role, meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: 1500,
  });
}

export function useJoinMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload?: JoinMeetingPayload }) =>
      meetingsApi.join(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.participants(role, meetingId) });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, meetingId) });
    },
  });
}

export function useLeaveMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: number | string) => meetingsApi.leave(role, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateParticipantRole() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
      participantRole,
      meetingId,
    }: {
      participantId: number | string;
      participantRole: ParticipantRole;
      meetingId: number | string;
    }) => meetingsApi.updateParticipantRole(role, participantId, participantRole),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.participants(role, meetingId) });
      toast.success(tt("roleSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("roleError"));
    },
  });
}

// ─── Chat Messages Hooks ──────────────────────────────────────────────────────
export function useMeetingMessages(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.messages(role, meetingId),
    queryFn: () => meetingsApi.getMessages(role, meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: 1500,
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      payload,
    }: {
      meetingId: number | string;
      payload: { message: string; attachment?: File };
    }) => meetingsApi.sendMessage(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.messages(role, meetingId) });
    },
  });
}

// ─── Polls Hooks ──────────────────────────────────────────────────────────────
export function useMeetingPolls(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId),
    queryFn: () => meetingsApi.getPolls(role, meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: 5000,
  });
}

export function useCreatePoll() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreatePollPayload }) =>
      meetingsApi.createPoll(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success(tt("pollCreateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("pollCreateError"));
    },
  });
}

export function useVotePoll() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, payload, meetingId }: { pollId: number | string; payload: VotePollPayload; meetingId: number | string }) =>
      meetingsApi.votePoll(role, pollId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success(tt("voteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("voteError"));
    },
  });
}

export function useClosePoll() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, meetingId }: { pollId: number | string; meetingId: number | string }) =>
      meetingsApi.closePoll(role, pollId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success(tt("pollCloseSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("pollCloseError"));
    },
  });
}

// ─── Whiteboard Hooks ─────────────────────────────────────────────────────────
export function useMeetingWhiteboard(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId),
    queryFn: () => meetingsApi.getWhiteboard(role, meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: 2000,
  });
}

export function useUpdateWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, elements }: { meetingId: number | string; elements: WhiteboardElement[] }) =>
      meetingsApi.replaceWhiteboard(role, meetingId, { elements }),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useDrawWhiteboardElement() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, element }: { meetingId: number | string; element: WhiteboardElement }) =>
      meetingsApi.drawElement(role, meetingId, element),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useDeleteWhiteboardElement() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, elementId }: { meetingId: number | string; elementId: string }) =>
      meetingsApi.deleteElement(role, meetingId, elementId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useUndoWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    // The API requires the board state to restore; it will not infer it.
    mutationFn: ({ meetingId, elements }: { meetingId: number | string; elements: WhiteboardElement[] }) =>
      meetingsApi.undoWhiteboard(role, meetingId, { elements }),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useRedoWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    // Like undo, the API requires the board state to restore.
    mutationFn: ({ meetingId, elements }: { meetingId: number | string; elements: WhiteboardElement[] }) =>
      meetingsApi.redoWhiteboard(role, meetingId, { elements }),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useUpdateWhiteboardElement() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      elementId,
      element,
    }: {
      meetingId: number | string;
      elementId: string;
      element: Partial<WhiteboardElement>;
    }) => meetingsApi.updateElement(role, meetingId, elementId, element),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useToggleWhiteboardElementLock() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      elementId,
      locked,
    }: {
      meetingId: number | string;
      elementId: string;
      locked: boolean;
    }) =>
      locked
        ? meetingsApi.lockElement(role, meetingId, elementId)
        : meetingsApi.unlockElement(role, meetingId, elementId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useToggleWhiteboardLock() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, locked }: { meetingId: number | string; locked: boolean }) =>
      locked
        ? meetingsApi.lockWhiteboard(role, meetingId)
        : meetingsApi.unlockWhiteboard(role, meetingId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
    onError: () => toast.error(tt("whiteboardLockDenied")),
  });
}

export function useClearWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: number | string) => meetingsApi.clearWhiteboard(role, meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
      toast.success(tt("whiteboardCleared"));
    },
  });
}

// ─── Notes Hooks ──────────────────────────────────────────────────────────────
export function useMeetingNotes(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId),
    queryFn: () => meetingsApi.getNotes(role, meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useCreateNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateNotePayload }) =>
      meetingsApi.createNote(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success(tt("noteCreateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("noteCreateError"));
    },
  });
}

export function useUpdateNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload, meetingId }: { noteId: number | string; payload: UpdateNotePayload; meetingId: number | string }) =>
      meetingsApi.updateNote(role, noteId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success(tt("noteUpdateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("noteUpdateError"));
    },
  });
}

export function useDeleteNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, meetingId }: { noteId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteNote(role, noteId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success(tt("noteDeleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("noteDeleteError"));
    },
  });
}

// ─── Decisions Hooks ──────────────────────────────────────────────────────────
export function useMeetingDecisions(meetingId: number | string, status?: string) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId, status),
    queryFn: () => meetingsApi.getDecisions(role, meetingId, status),
    enabled: Boolean(meetingId),
  });
}

export function useCreateDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateDecisionPayload }) =>
      meetingsApi.createDecision(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success(tt("decisionCreateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("decisionCreateError"));
    },
  });
}

export function useApproveDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ decisionId, meetingId }: { decisionId: number | string; meetingId: number | string }) =>
      meetingsApi.approveDecision(role, decisionId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success(tt("decisionApproveSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("decisionApproveError"));
    },
  });
}

export function useDeleteDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ decisionId, meetingId }: { decisionId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteDecision(role, decisionId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success(tt("decisionDeleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("decisionDeleteError"));
    },
  });
}

// ─── Action Items Hooks ───────────────────────────────────────────────────────
export function useMeetingActionItems(meetingId: number | string, filters?: any) {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId, filters),
    queryFn: () => meetingsApi.getActionItems(role, meetingId, filters),
    enabled: Boolean(meetingId),
  });
}

export function useCreateActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateActionItemPayload }) =>
      meetingsApi.createActionItem(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success(tt("actionCreateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("actionCreateError"));
    },
  });
}

export function useCompleteActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ actionItemId, meetingId }: { actionItemId: number | string; meetingId: number | string }) =>
      meetingsApi.completeActionItem(role, actionItemId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success(tt("actionCompleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("actionCompleteError"));
    },
  });
}

export function useDeleteActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ actionItemId, meetingId }: { actionItemId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteActionItem(role, actionItemId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success(tt("actionDeleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("actionDeleteError"));
    },
  });
}

// ─── Task Conversion Hooks ────────────────────────────────────────────────────
export function useConvertDecisionToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      decisionId,
      payload,
    }: {
      decisionId: number | string;
      payload: ConvertToTaskPayload;
      meetingId?: number | string;
    }) => meetingsApi.convertDecisionToTask(role, decisionId, payload),
    onSuccess: (_, { meetingId }) => {
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(tt("decisionToTaskSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("decisionToTaskError"));
    },
  });
}

export function useConvertActionItemToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionItemId,
      payload,
    }: {
      actionItemId: number | string;
      payload: ConvertToTaskPayload;
      meetingId?: number | string;
    }) => meetingsApi.convertActionItemToTask(role, actionItemId, payload),
    onSuccess: (_, { meetingId }) => {
      if (meetingId) {
        queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(tt("actionToTaskSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("actionToTaskError"));
    },
  });
}

export function useConvertMessageToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const tt = useTranslations("meetings.toasts");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      payload,
    }: {
      messageId: number | string;
      payload: ConvertToTaskPayload;
      meetingId?: number | string;
    }) => meetingsApi.convertMessageToTask(role, messageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(tt("messageToTaskSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || tt("messageToTaskError"));
    },
  });
}
