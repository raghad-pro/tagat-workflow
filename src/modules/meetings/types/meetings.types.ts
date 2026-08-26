// ─── Meetings Types ────────────────────────────────────────────────────────────

export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "waiting" | "live" | "ended" | "cancelled";
export type ParticipantRole = "host" | "co_host" | "participant" | "viewer";
export type ConnectionStatus = "connected" | "disconnected" | "reconnecting" | "idle";
export type InvitationStatus = "pending" | "accepted" | "declined" | "tentative";
export type NoteStatus = "draft" | "published";
export type DecisionStatus = "pending" | "approved" | "rejected";
export type ActionItemStatus = "pending" | "in_progress" | "completed";
export type ActionItemPriority = "low" | "medium" | "high" | "urgent";

export interface UserSummary {
  id: number;
  name: string;
  email?: string;
  avatar?: string | null;
  role?: string;
}

export interface Meeting {
  id: number;
  company_id?: number | null;
  project_id?: number | null;
  conversation_id?: number | null;
  created_by?: number;
  title: string;
  description?: string | null;
  meeting_code: string;
  type: MeetingType;
  status: MeetingStatus;
  is_private: boolean;
  password?: string | null;
  allow_chat: boolean;
  allow_recording: boolean;
  allow_screen_share: boolean;
  allow_whiteboard: boolean;
  allow_file_share: boolean;
  max_participants: number;
  scheduled_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration?: number | null;
  peak_participants?: number;
  room_name?: string;
  created_at?: string;
  updated_at?: string;
  creator?: UserSummary;
  organizer?: UserSummary;
  project?: {
    id: number;
    name?: string;
    title?: string;
  } | null;
  participants_count?: number;
  participants?: MeetingParticipant[];
}

export interface CreateMeetingPayload {
  title: string;
  description?: string | null;
  type?: MeetingType;
  scheduled_at?: string | null;
  is_private?: boolean;
  password?: string | null;
  max_participants?: number;
  allow_chat?: boolean;
  allow_recording?: boolean;
  allow_screen_share?: boolean;
  allow_whiteboard?: boolean;
  allow_file_share?: boolean;
  project_id?: number | null;
  company_id?: number | null;
  amount?: number | null;
  conversation_id?: number | null;
  participant_ids?: number[];
}

export interface UpdateMeetingPayload extends Partial<CreateMeetingPayload> {
  status?: MeetingStatus;
}

export interface MeetingFilters {
  search?: string;
  status?: MeetingStatus | "all";
  type?: MeetingType | "all";
  project_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface MeetingStats {
  total_meetings: number;
  upcoming_meetings: number;
  in_progress_meetings: number;
  ended_meetings: number;
  total_hours?: number | string;
}

// ─── Invitations ──────────────────────────────────────────────────────────────
export interface MeetingInvitation {
  id: number;
  meeting_id: number;
  user_id: number;
  invited_by: number;
  status: InvitationStatus;
  sent_at?: string;
  accepted_at?: string | null;
  declined_at?: string | null;
  user?: UserSummary;
  meeting?: Partial<Meeting>;
}

/**
 * Whose invitation a row is, however the API chose to serialise it.
 *
 * The flat `user_id` is only one of the shapes that comes back: an endpoint
 * that serialises the relation hands over `user: { id }` and drops the foreign
 * key. Reading `row.user_id` alone then yields `undefined`, every "is this
 * mine?" comparison fails, and an invitation that was really sent is filtered
 * out of the bell and out of the room gate. The employee and client pickers
 * already read both forms; invitations did not.
 */
export function invitationUserId(row: unknown): number | null {
  const candidate = row as Record<string, any> | null | undefined;
  const raw =
    candidate?.user_id ??
    candidate?.user?.id ??
    candidate?.invitee_id ??
    candidate?.invited_user_id;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

/**
 * Whether a roster row is someone currently in the meeting.
 *
 * `left_at` is NOT cleared by the API when someone rejoins, so a stale
 * timestamp older than `joined_at` must not count as "gone" — that is why
 * `connection_status` is checked first and `left_at` only breaks ties.
 *
 * Kept separate from fetching so each screen can choose: the room shows who is
 * live, the details screen shows the whole roster including people who have
 * left, because their roles are still editable there.
 */
export function isActiveParticipant(p: {
  connection_status?: string;
  joined_at?: string | null;
  left_at?: string | null;
}): boolean {
  if (p.connection_status === "disconnected") return false;
  if (!p.left_at) return true;
  if (!p.joined_at) return false;
  return new Date(p.left_at).getTime() <= new Date(p.joined_at).getTime();
}

export interface SendInvitationPayload {
  user_id: number;
  role?: ParticipantRole;
}

// ─── Participants ─────────────────────────────────────────────────────────────
export interface MeetingParticipant {
  id: number;
  meeting_id: number;
  user_id: number;
  role: ParticipantRole;
  connection_status: ConnectionStatus;
  camera_enabled: boolean;
  microphone_enabled: boolean;
  screen_share_enabled: boolean;
  muted_by_host: boolean;
  joined_at?: string;
  // The API does not clear `left_at` when a participant rejoins, so it is only
  // meaningful when compared against `joined_at` — never as a "has left" flag.
  left_at?: string | null;
  last_seen_at?: string | null;
  duration?: number;
  user?: UserSummary;
}

export interface JoinMeetingPayload {
  password?: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface MeetingAttachment {
  id: number;
  message_id?: number;
  file_name: string;
  /** The API sends `size` and `mime_type`; the rest are legacy spellings. */
  size?: number;
  mime_type?: string;
  /** "image" | "document" | … — the server's own coarse classification. */
  type?: string;
  file_size?: number;
  file_type?: string;
  /**
   * Not sent by the API. The payload has no path or URL at all, so the link is
   * built from `id` via `meetingsApi.attachmentDownloadUrl`.
   */
  file_url?: string;
  download_url?: string;
}

export interface MeetingMessage {
  id: number;
  meeting_id: number;
  user_id: number;
  message: string;
  attachments?: MeetingAttachment[];
  created_at: string;
  user?: UserSummary;
}

export interface SendMessagePayload {
  message: string;
  attachment?: File | Blob;
}

// ─── Polls ────────────────────────────────────────────────────────────────────
export interface PollOption {
  id?: number;
  title: string;
  votes_count?: number;
  is_voted?: boolean;
}

export interface MeetingPoll {
  id: number;
  meeting_id: number;
  created_by?: number;
  question: string;
  description?: string | null;
  options: PollOption[];
  multiple_choice: boolean;
  show_results: boolean;
  anonymous: boolean;
  allow_change_vote: boolean;
  is_closed?: boolean;
  total_votes?: number;
  created_at?: string;
  creator?: UserSummary;
}

export interface CreatePollPayload {
  question: string;
  description?: string | null;
  options: { title: string }[];
  multiple_choice?: boolean;
  show_results?: boolean;
  anonymous?: boolean;
  allow_change_vote?: boolean;
}

export interface VotePollPayload {
  option_ids: number[];
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────
export type WhiteboardElementType =
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "freehand";

/**
 * The API validates these per type:
 *   rectangle → width, height   circle → radius
 *   line/arrow → x1, y1, x2, y2 text → text
 *   freehand → points
 * `id` must be a UUID; anything else is rejected with 422.
 */
export interface WhiteboardElement {
  id: string;
  type: WhiteboardElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: { x: number; y: number }[];
  text?: string;
  z_index?: number;
  is_locked?: boolean;
  style?: {
    color?: string;
    stroke_width?: number;
    background_color?: string;
    font_size?: number;
  };
}

export interface WhiteboardState {
  is_locked?: boolean;
  content: {
    elements: WhiteboardElement[];
  };
}

// ─── Media (LiveKit) ──────────────────────────────────────────────────────────
export interface MediaTokenResponse {
  token: string;
  url: string;
  room: string;
  identity: string;
  expires_at?: string;
  can_publish?: boolean;
  can_share_screen?: boolean;
}

/** Payload of `POST /meetings/{id}/media/join` — joins the roster and mints a
 *  LiveKit token in one round trip. */
export interface MediaJoinResponse {
  participant: MeetingParticipant;
  media: MediaTokenResponse;
}

// ─── Notes ────────────────────────────────────────────────────────────────────
export interface MeetingNote {
  id: number;
  meeting_id: number;
  created_by?: number;
  title: string;
  content: string;
  status: NoteStatus;
  is_shared: boolean;
  created_at?: string;
  updated_at?: string;
  creator?: UserSummary;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  status?: NoteStatus;
  is_shared?: boolean;
}

export interface UpdateNotePayload extends Partial<CreateNotePayload> {}

// ─── Decisions ────────────────────────────────────────────────────────────────
export interface MeetingDecision {
  id: number;
  meeting_id: number;
  created_by?: number;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  status: DecisionStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: UserSummary;
  assignee?: UserSummary;
}

export interface CreateDecisionPayload {
  title: string;
  description?: string | null;
  assigned_to?: number | null;
}

// ─── Action Items ─────────────────────────────────────────────────────────────
export interface MeetingActionItem {
  id: number;
  meeting_id: number;
  created_by?: number;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  priority: ActionItemPriority;
  due_date?: string | null;
  status: ActionItemStatus;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: UserSummary;
  assignee?: UserSummary;
}

export interface CreateActionItemPayload {
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  priority?: ActionItemPriority;
  due_date?: string | null;
}

// ─── Task Conversion ──────────────────────────────────────────────────────────
export interface ConvertToTaskPayload {
  project_id: number;
  assigned_to?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  sprint_id?: number;
  due_date?: string;
  title?: string;
  description?: string;
}
