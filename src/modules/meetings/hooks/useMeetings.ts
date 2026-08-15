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

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.list(role, filters),
    queryFn: () => meetingsApi.getAll(role, filters),
    staleTime: 30000,
  });
}

export function useMeetingDetails(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) => meetingsApi.create(role, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success("تم إنشاء الاجتماع بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إنشاء الاجتماع");
    },
  });
}

export function useUpdateMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateMeetingPayload }) =>
      meetingsApi.update(role, id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success("تم تحديث الاجتماع بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحديث الاجتماع");
    },
  });
}

export function useDeleteMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success("تم حذف الاجتماع بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في حذف الاجتماع");
    },
  });
}

export function useStartMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.start(role, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success("تم بدء الاجتماع بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في بدء الاجتماع");
    },
  });
}

export function useEndMeeting() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => meetingsApi.end(role, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.detail(role, id) });
      toast.success("تم إنهاء الاجتماع");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إنهاء الاجتماع");
    },
  });
}

// ─── Invitations Hooks ────────────────────────────────────────────────────────
export function useMeetingInvitations(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.invitations(role, meetingId),
    queryFn: () => meetingsApi.getInvitations(role, meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useSendInvitation() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: SendInvitationPayload }) =>
      meetingsApi.sendInvitation(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.invitations(role, meetingId) });
      toast.success("تم إرسال الدعوة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إرسال الدعوة");
    },
  });
}

export function useRespondInvitation() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: number | string; status: InvitationStatus }) =>
      meetingsApi.respondInvitation(role, invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      toast.success("تم الرد على الدعوة");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحديث الدعوة");
    },
  });
}

// ─── Participants Hooks ───────────────────────────────────────────────────────
export function useMeetingParticipants(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

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
      toast.success("تم تحديث دور المشارك");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحديث الدور");
    },
  });
}

// ─── Chat Messages Hooks ──────────────────────────────────────────────────────
export function useMeetingMessages(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreatePollPayload }) =>
      meetingsApi.createPoll(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success("تم إنشاء استطلاع الرأي بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إنشاء الاستطلاع");
    },
  });
}

export function useVotePoll() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, payload, meetingId }: { pollId: number | string; payload: VotePollPayload; meetingId: number | string }) =>
      meetingsApi.votePoll(role, pollId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success("تم تسجيل صوتك بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تسجيل التصويت");
    },
  });
}

export function useClosePoll() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, meetingId }: { pollId: number | string; meetingId: number | string }) =>
      meetingsApi.closePoll(role, pollId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.polls(role, meetingId) });
      toast.success("تم إغلاق استطلاع الرأي");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إغلاق الاستطلاع");
    },
  });
}

// ─── Whiteboard Hooks ─────────────────────────────────────────────────────────
export function useMeetingWhiteboard(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId),
    queryFn: () => meetingsApi.getWhiteboard(role, meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useUpdateWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, element }: { meetingId: number | string; element: WhiteboardElement }) =>
      meetingsApi.drawElement(role, meetingId, element),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
    },
  });
}

export function useClearWhiteboard() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: number | string) => meetingsApi.clearWhiteboard(role, meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.whiteboard(role, meetingId) });
      toast.success("تم مسح السبورة");
    },
  });
}

// ─── Notes Hooks ──────────────────────────────────────────────────────────────
export function useMeetingNotes(meetingId: number | string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId),
    queryFn: () => meetingsApi.getNotes(role, meetingId),
    enabled: Boolean(meetingId),
  });
}

export function useCreateNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateNotePayload }) =>
      meetingsApi.createNote(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success("تمت إضافة الملاحظة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إضافة الملاحظة");
    },
  });
}

export function useUpdateNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload, meetingId }: { noteId: number | string; payload: UpdateNotePayload; meetingId: number | string }) =>
      meetingsApi.updateNote(role, noteId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success("تم تحديث الملاحظة");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحديث الملاحظة");
    },
  });
}

export function useDeleteNote() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, meetingId }: { noteId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteNote(role, noteId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.notes(role, meetingId) });
      toast.success("تم حذف الملاحظة");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في حذف الملاحظة");
    },
  });
}

// ─── Decisions Hooks ──────────────────────────────────────────────────────────
export function useMeetingDecisions(meetingId: number | string, status?: string) {
  const { user } = useAuth();
  const role = user?.role || "employee";

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId, status),
    queryFn: () => meetingsApi.getDecisions(role, meetingId, status),
    enabled: Boolean(meetingId),
  });
}

export function useCreateDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateDecisionPayload }) =>
      meetingsApi.createDecision(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success("تم تسجيل القرار بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تسجيل القرار");
    },
  });
}

export function useApproveDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ decisionId, meetingId }: { decisionId: number | string; meetingId: number | string }) =>
      meetingsApi.approveDecision(role, decisionId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success("تم اعتماد القرار بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في اعتماد القرار");
    },
  });
}

export function useDeleteDecision() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ decisionId, meetingId }: { decisionId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteDecision(role, decisionId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.decisions(role, meetingId) });
      toast.success("تم حذف القرار");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في حذف القرار");
    },
  });
}

// ─── Action Items Hooks ───────────────────────────────────────────────────────
export function useMeetingActionItems(meetingId: number | string, filters?: any) {
  const { user } = useAuth();
  const role = user?.role || "employee";

  return useQuery({
    queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId, filters),
    queryFn: () => meetingsApi.getActionItems(role, meetingId, filters),
    enabled: Boolean(meetingId),
  });
}

export function useCreateActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, payload }: { meetingId: number | string; payload: CreateActionItemPayload }) =>
      meetingsApi.createActionItem(role, meetingId, payload),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success("تمت إضافة بند العمل بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إضافة بند العمل");
    },
  });
}

export function useCompleteActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ actionItemId, meetingId }: { actionItemId: number | string; meetingId: number | string }) =>
      meetingsApi.completeActionItem(role, actionItemId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success("تم إكمال بند العمل بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في إكمال بند العمل");
    },
  });
}

export function useDeleteActionItem() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ actionItemId, meetingId }: { actionItemId: number | string; meetingId: number | string }) =>
      meetingsApi.deleteActionItem(role, actionItemId),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.actionItems(role, meetingId) });
      toast.success("تم حذف بند العمل");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في حذف بند العمل");
    },
  });
}

// ─── Task Conversion Hooks ────────────────────────────────────────────────────
export function useConvertDecisionToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
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
      toast.success("تم تحويل القرار إلى مهمة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحويل القرار إلى مهمة");
    },
  });
}

export function useConvertActionItemToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
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
      toast.success("تم تحويل التوصية إلى مهمة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحويل التوصية إلى مهمة");
    },
  });
}

export function useConvertMessageToTask() {
  const { user } = useAuth();
  const role = user?.role || "employee";
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
      toast.success("تم تحويل الرسالة إلى مهمة بنجاح");
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل في تحويل الرسالة إلى مهمة");
    },
  });
}
