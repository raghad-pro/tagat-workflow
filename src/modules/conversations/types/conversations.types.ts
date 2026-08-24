/**
 * The `type` values the backend actually accepts (verified against the live API —
 * "private"/"group" are rejected with "The selected type is invalid").
 *   team_chat   → conversations with internal team members (employees)
 *   client_chat → conversations that include a client
 * Whether a conversation is a group is derived by the server from the member
 * count and returned as `is_group` — it is NOT part of `type`.
 */
export type ConversationType = "team_chat" | "client_chat";

/** How the create dialog lets the user pick participants — UI concept only. */
export type ConversationMode = "private" | "group";

export type MemberRole = "owner" | "admin" | "moderator" | "member";

export interface ConversationUser {
  id: number | string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  image?: string | null;
  avatar?: string | null;
}

/**
 * A row of the conversation ↔ user pivot. `id` is the *membership* id and is NOT
 * interchangeable with the user id — the members endpoints are keyed by user id.
 */
export interface ConversationMember extends ConversationUser {
  user_id?: number | string;
  conversation_id?: number | string;
  role?: MemberRole | string;
  pivot?: { role?: MemberRole | string; user_id?: number | string };
  user?: ConversationUser;
}

export interface MessageAttachment {
  id?: number | string;
  /** Storage-relative, e.g. `messages/ab12….png` — this is what the API sends. */
  file_path?: string;
  /** Original upload name, e.g. `diagram.png` — this is what the API sends. */
  file_name?: string;
  /** Absolute URL. Only legacy payloads carry one. */
  url?: string;
  path?: string;
  name?: string;
  mime_type?: string;
  size?: number;
}

export interface Message {
  id: number | string;
  conversation_id?: number | string;
  /** The API writes `sender_id`; `user_id` is only present on legacy payloads. */
  user_id?: number | string;
  sender_id?: number | string;
  status?: string;
  /** The API writes `message`; older payloads used `body`. */
  message?: string;
  body?: string;
  type?: string;
  attachment?: string | MessageAttachment | null;
  attachments?: MessageAttachment[];
  files?: MessageAttachment[];
  created_at?: string;
  user?: ConversationUser;
  sender?: ConversationUser;
  /** Client-side only: set on optimistic messages that are not confirmed yet. */
  _optimistic?: boolean;
}

export interface Conversation {
  id: number | string;
  /** Null for 1-on-1 conversations — the server only stores a title for groups. */
  title?: string | null;
  name?: string;
  type?: ConversationType | string;
  is_group?: boolean;
  image?: string | null;
  created_by?: number | string;
  created_at?: string;
  updated_at?: string;
  users?: ConversationMember[];
  members?: ConversationMember[];
  participants?: ConversationMember[];
  creator?: ConversationUser;
  /**
   * The detail endpoint returns the other participant of a 1-on-1 chat here.
   * Flattened onto the conversation by the API layer.
   */
  receiver?: ConversationMember | null;
  /** Detail: the whole thread. List: only the most recent message. */
  messages?: Message[] | { data: Message[] };
  last_message?: Message | null;
  last_message_at?: string;
  /** List-only: timestamp of the newest message, used for sorting/preview. */
  messages_max_created_at?: string;
  unread_count?: number;
}

export interface ConversationsQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: unknown;
}

export interface ListMeta {
  total: number;
  current_page?: number;
  last_page?: number;
  per_page?: number;
}

export interface ConversationsListResult {
  data: Conversation[];
  meta: ListMeta;
}

export interface CreateConversationPayload {
  type: ConversationType;
  /** Only meaningful for group conversations; the server ignores it for 1-on-1. */
  title?: string;
  users: (number | string)[];
}

export interface SendMessagePayload {
  message: string;
  files?: File[];
}

export interface UpdateConversationPayload {
  title?: string;
  image?: File | null;
}
