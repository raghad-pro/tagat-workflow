import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Meeting,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  MeetingFilters,
  MeetingInvitation,
  SendInvitationPayload,
  InvitationStatus,
  MeetingParticipant,
  ParticipantRole,
  JoinMeetingPayload,
  MeetingMessage,
  MeetingPoll,
  CreatePollPayload,
  VotePollPayload,
  WhiteboardState,
  WhiteboardElement,
  MediaTokenResponse,
  MeetingNote,
  CreateNotePayload,
  UpdateNotePayload,
  MeetingDecision,
  CreateDecisionPayload,
  MeetingActionItem,
  CreateActionItemPayload,
  ConvertToTaskPayload,
} from "../types/meetings.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

interface PaginatedData<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export const meetingsApi = {
  // ─── 01 - Meetings (CRUD & Lifecycle) ───────────────────────────────────────
  getAll: async (role: string, params?: MeetingFilters) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<Meeting> | Meeting[]>>(
      `${prefix}/meetings`,
      params as Record<string, unknown>
    );
    const res = response?.data;
    if (Array.isArray(res)) {
      return { data: res, total: res.length };
    }
    if (res && "data" in res && Array.isArray(res.data)) {
      return {
        data: res.data,
        total: res.total || res.data.length,
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
      };
    }
    return { data: [], total: 0, current_page: 1, last_page: 1 };
  },

  getById: async (role: string, id: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<Meeting>>(`${prefix}/meetings/${id}`);
    return response.data;
  },

  create: async (role: string, payload: CreateMeetingPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<Meeting>>(`${prefix}/meetings`, payload);
    return response.data;
  },

  update: async (role: string, id: number | string, payload: UpdateMeetingPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<Meeting>>(`${prefix}/meetings/${id}`, payload);
    return response.data;
  },

  delete: async (role: string, id: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.delete<ApiResponse<null>>(`${prefix}/meetings/${id}`);
    return response.data;
  },

  start: async (role: string, id: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<Meeting>>(`${prefix}/meetings/${id}/start`);
    return response.data;
  },

  end: async (role: string, id: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<Meeting>>(`${prefix}/meetings/${id}/end`);
    return response.data;
  },

  // ─── 02 - Invitations ───────────────────────────────────────────────────────
  getInvitations: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingInvitation> | MeetingInvitation[]>>(
      `${prefix}/meetings/${meetingId}/invitations`
    );
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  sendInvitation: async (role: string, meetingId: number | string, payload: SendInvitationPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingInvitation>>(
      `${prefix}/meetings/${meetingId}/invitations`,
      payload
    );
    return response.data;
  },

  respondInvitation: async (role: string, invitationId: number | string, status: InvitationStatus) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingInvitation>>(
      `${prefix}/meeting-invitations/${invitationId}`,
      { status }
    );
    return response.data;
  },

  // ─── 03 - Participants ──────────────────────────────────────────────────────
  getParticipants: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<any>(
      `${prefix}/meetings/${meetingId}/participants`
    );
    let list: MeetingParticipant[] = [];
    const res = response?.data;
    if (Array.isArray(res)) {
      list = res;
    } else if (res && "data" in res && Array.isArray(res.data)) {
      list = res.data;
    } else if (Array.isArray(response)) {
      list = response;
    }

    // Filter out participants who left or are disconnected
    return list.filter(
      (p: any) =>
        (!p.left_at || p.left_at === null) &&
        p.connection_status !== "disconnected" &&
        p.connection_status !== "idle"
    );
  },

  join: async (role: string, meetingId: number | string, payload?: JoinMeetingPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<any>(
      `${prefix}/meetings/${meetingId}/join`,
      payload
    );
    return response?.data || response;
  },

  leave: async (role: string, participantId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<any>(
      `${prefix}/meeting-participants/${participantId}/leave`
    );
    return response?.data || response;
  },

  updateParticipantRole: async (
    role: string,
    participantId: number | string,
    participantRole: ParticipantRole
  ) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingParticipant>>(
      `${prefix}/meeting-participants/${participantId}`,
      { role: participantRole }
    );
    return response.data;
  },

  // ─── 04 - Chat ──────────────────────────────────────────────────────────────
  getMessages: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingMessage> | MeetingMessage[]>>(
      `${prefix}/meetings/${meetingId}/messages`
    );
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  sendMessage: async (
    role: string,
    meetingId: number | string,
    payload: { message: string; attachment?: File }
  ) => {
    const prefix = getRolePrefix(role);
    let body: any = payload;
    if (payload.attachment) {
      const formData = new FormData();
      formData.append("message", payload.message);
      formData.append("attachment", payload.attachment);
      body = formData;
    }
    const response = await apiClient.post<ApiResponse<MeetingMessage>>(
      `${prefix}/meetings/${meetingId}/messages`,
      body
    );
    return response.data;
  },

  getAttachmentDownloadUrl: (role: string, attachmentId: number | string) => {
    const prefix = getRolePrefix(role);
    return `${prefix}/meeting-attachments/${attachmentId}/download`;
  },

  // ─── 05 - Polls ─────────────────────────────────────────────────────────────
  getPolls: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingPoll> | MeetingPoll[]>>(
      `${prefix}/meetings/${meetingId}/polls`
    );
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getPollById: async (role: string, pollId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<MeetingPoll>>(
      `${prefix}/meeting-polls/${pollId}`
    );
    return response.data;
  },

  createPoll: async (role: string, meetingId: number | string, payload: CreatePollPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingPoll>>(
      `${prefix}/meetings/${meetingId}/polls`,
      payload
    );
    return response.data;
  },

  updatePoll: async (role: string, pollId: number | string, payload: Partial<CreatePollPayload>) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingPoll>>(
      `${prefix}/meeting-polls/${pollId}`,
      payload
    );
    return response.data;
  },

  votePoll: async (role: string, pollId: number | string, payload: VotePollPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingPoll>>(
      `${prefix}/meeting-polls/${pollId}/vote`,
      payload
    );
    return response.data;
  },

  closePoll: async (role: string, pollId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingPoll>>(
      `${prefix}/meeting-polls/${pollId}/close`
    );
    return response.data;
  },

  // ─── 06 - Whiteboard ────────────────────────────────────────────────────────
  getWhiteboard: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard`
    );
    return response.data;
  },

  replaceWhiteboard: async (role: string, meetingId: number | string, content: { elements: WhiteboardElement[] }) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard`,
      { content }
    );
    return response.data;
  },

  undoWhiteboard: async (role: string, meetingId: number | string, content?: { elements: WhiteboardElement[] }) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard/undo`,
      content ? { content } : undefined
    );
    return response.data;
  },

  redoWhiteboard: async (role: string, meetingId: number | string, content?: { elements: WhiteboardElement[] }) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard/redo`,
      content ? { content } : undefined
    );
    return response.data;
  },

  clearWhiteboard: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard/clear`
    );
    return response.data;
  },

  lockWhiteboard: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard/lock`
    );
    return response.data;
  },

  unlockWhiteboard: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardState>>(
      `${prefix}/meetings/${meetingId}/whiteboard/unlock`
    );
    return response.data;
  },

  drawElement: async (role: string, meetingId: number | string, element: WhiteboardElement) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardElement>>(
      `${prefix}/meetings/${meetingId}/whiteboard/elements`,
      element
    );
    return response.data;
  },

  updateElement: async (
    role: string,
    meetingId: number | string,
    elementId: string,
    element: Partial<WhiteboardElement>
  ) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<WhiteboardElement>>(
      `${prefix}/meetings/${meetingId}/whiteboard/elements/${elementId}`,
      element
    );
    return response.data;
  },

  deleteElement: async (role: string, meetingId: number | string, elementId: string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.delete<ApiResponse<null>>(
      `${prefix}/meetings/${meetingId}/whiteboard/elements/${elementId}`
    );
    return response.data;
  },

  lockElement: async (role: string, meetingId: number | string, elementId: string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardElement>>(
      `${prefix}/meetings/${meetingId}/whiteboard/elements/${elementId}/lock`
    );
    return response.data;
  },

  unlockElement: async (role: string, meetingId: number | string, elementId: string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<WhiteboardElement>>(
      `${prefix}/meetings/${meetingId}/whiteboard/elements/${elementId}/unlock`
    );
    return response.data;
  },

  // ─── 07 - Media (LiveKit) ───────────────────────────────────────────────────
  issueMediaToken: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MediaTokenResponse>>(
      `${prefix}/meetings/${meetingId}/media-token`
    );
    return response.data;
  },

  mediaJoin: async (role: string, meetingId: number | string, password?: string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<any>>(
      `${prefix}/meetings/${meetingId}/media/join`,
      password ? { password } : undefined
    );
    return response.data;
  },

  mediaLeave: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<any>>(
      `${prefix}/meetings/${meetingId}/media/leave`
    );
    return response.data;
  },

  // ─── 08 - Notes ─────────────────────────────────────────────────────────────
  getNotes: async (role: string, meetingId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingNote> | MeetingNote[]>>(
      `${prefix}/meetings/${meetingId}/notes`
    );
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getNoteById: async (role: string, noteId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<MeetingNote>>(
      `${prefix}/meeting-notes/${noteId}`
    );
    return response.data;
  },

  createNote: async (role: string, meetingId: number | string, payload: CreateNotePayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingNote>>(
      `${prefix}/meetings/${meetingId}/notes`,
      payload
    );
    return response.data;
  },

  updateNote: async (role: string, noteId: number | string, payload: UpdateNotePayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingNote>>(
      `${prefix}/meeting-notes/${noteId}`,
      payload
    );
    return response.data;
  },

  deleteNote: async (role: string, noteId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.delete<ApiResponse<null>>(
      `${prefix}/meeting-notes/${noteId}`
    );
    return response.data;
  },

  // ─── 09 - Decisions ─────────────────────────────────────────────────────────
  getDecisions: async (role: string, meetingId: number | string, status?: string) => {
    const prefix = getRolePrefix(role);
    const url = status
      ? `${prefix}/meetings/${meetingId}/decisions?status=${status}`
      : `${prefix}/meetings/${meetingId}/decisions`;
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingDecision> | MeetingDecision[]>>(url);
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getDecisionById: async (role: string, decisionId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<MeetingDecision>>(
      `${prefix}/meeting-decisions/${decisionId}`
    );
    return response.data;
  },

  createDecision: async (role: string, meetingId: number | string, payload: CreateDecisionPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingDecision>>(
      `${prefix}/meetings/${meetingId}/decisions`,
      payload
    );
    return response.data;
  },

  updateDecision: async (role: string, decisionId: number | string, payload: Partial<CreateDecisionPayload>) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingDecision>>(
      `${prefix}/meeting-decisions/${decisionId}`,
      payload
    );
    return response.data;
  },

  deleteDecision: async (role: string, decisionId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.delete<ApiResponse<null>>(
      `${prefix}/meeting-decisions/${decisionId}`
    );
    return response.data;
  },

  approveDecision: async (role: string, decisionId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingDecision>>(
      `${prefix}/meeting-decisions/${decisionId}/approve`
    );
    return response.data;
  },

  // ─── 10 - Action Items ──────────────────────────────────────────────────────
  getActionItems: async (role: string, meetingId: number | string, filters?: { status?: string; assigned_to?: number }) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<PaginatedData<MeetingActionItem> | MeetingActionItem[]>>(
      `${prefix}/meetings/${meetingId}/action-items`,
      filters as Record<string, unknown>
    );
    const res = response?.data;
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getActionItemById: async (role: string, actionItemId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<ApiResponse<MeetingActionItem>>(
      `${prefix}/meeting-action-items/${actionItemId}`
    );
    return response.data;
  },

  createActionItem: async (role: string, meetingId: number | string, payload: CreateActionItemPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingActionItem>>(
      `${prefix}/meetings/${meetingId}/action-items`,
      payload
    );
    return response.data;
  },

  updateActionItem: async (role: string, actionItemId: number | string, payload: Partial<CreateActionItemPayload>) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.put<ApiResponse<MeetingActionItem>>(
      `${prefix}/meeting-action-items/${actionItemId}`,
      payload
    );
    return response.data;
  },

  deleteActionItem: async (role: string, actionItemId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.delete<ApiResponse<null>>(
      `${prefix}/meeting-action-items/${actionItemId}`
    );
    return response.data;
  },

  completeActionItem: async (role: string, actionItemId: number | string) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<MeetingActionItem>>(
      `${prefix}/meeting-action-items/${actionItemId}/complete`
    );
    return response.data;
  },

  // ─── 11 - Task Conversion ───────────────────────────────────────────────────
  convertDecisionToTask: async (role: string, decisionId: number | string, payload: ConvertToTaskPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<any>>(
      `${prefix}/meeting-decisions/${decisionId}/convert-to-task`,
      payload
    );
    return response.data;
  },

  convertActionItemToTask: async (role: string, actionItemId: number | string, payload: ConvertToTaskPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<any>>(
      `${prefix}/meeting-action-items/${actionItemId}/convert-to-task`,
      payload
    );
    return response.data;
  },

  convertMessageToTask: async (role: string, messageId: number | string, payload: ConvertToTaskPayload) => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.post<ApiResponse<any>>(
      `${prefix}/meeting-messages/${messageId}/convert-to-task`,
      payload
    );
    return response.data;
  },
};
