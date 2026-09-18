import { getFilesBaseUrl } from "@/services/apiFailover";
import type {
  Conversation,
  ConversationMember,
  ConversationUser,
  Message,
} from "../types/conversations.types";

/**
 * The id the members endpoints are keyed by (`/conversations/{id}/members/{user}`).
 * A pivot row's own `id` is the membership id, so it is only used as a last resort.
 */
export function getMemberUserId(member: ConversationMember | undefined | null) {
  if (!member) return undefined;
  return member.user_id ?? member.pivot?.user_id ?? member.user?.id ?? member.id;
}

export function getMemberName(member: ConversationMember | undefined | null): string {
  if (!member) return "User";
  const u = member.user ?? member;
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return (u.name || full || u.email || "User") as string;
}

export function getMemberImage(member: ConversationMember | undefined | null) {
  if (!member) return null;
  const u = member.user ?? member;
  return u.image || u.avatar || null;
}

export function getMemberRole(member: ConversationMember | undefined | null) {
  if (!member) return "member";
  return String(member.pivot?.role ?? member.role ?? "member").toLowerCase();
}

/** All participants, whichever key the endpoint used for them. */
export function getMembers(conversation?: Conversation | null): ConversationMember[] {
  if (!conversation) return [];
  const candidates = [
    conversation.users,
    conversation.members,
    conversation.participants,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  return [];
}

/**
 * Trusts the server's `type`/`is_group` flag. Counting members is not a valid
 * fallback: a private chat also has 2 members.
 */
export function isGroupConversation(conversation?: Conversation | null): boolean {
  if (!conversation) return false;
  if (typeof conversation.is_group === "boolean") return conversation.is_group;
  return String(conversation.type ?? "").toLowerCase() === "group";
}

/**
 * The participant that is not the signed-in user (1-on-1 chats). The detail
 * endpoint hands this to us directly as `receiver`; the list endpoint does not,
 * so it is derived from the members there.
 */
export function getOtherMember(
  conversation: Conversation | null | undefined,
  currentUserId: number | string | undefined
): ConversationMember | undefined {
  if (conversation?.receiver) return conversation.receiver;

  const members = getMembers(conversation);
  if (members.length === 0) return undefined;
  if (currentUserId == null) return members[0];
  return (
    members.find((m) => String(getMemberUserId(m)) !== String(currentUserId)) ??
    members[0]
  );
}

export function getConversationTitle(
  conversation: Conversation | null | undefined,
  currentUserId: number | string | undefined,
  fallback = "Conversation"
): string {
  if (!conversation) return fallback;
  if (isGroupConversation(conversation)) {
    return conversation.title || conversation.name || fallback;
  }
  const other = getOtherMember(conversation, currentUserId);
  if (other) return getMemberName(other);
  return conversation.title || conversation.name || fallback;
}

export function getConversationImage(
  conversation: Conversation | null | undefined,
  currentUserId: number | string | undefined
): string | null {
  if (!conversation) return null;
  if (isGroupConversation(conversation)) return conversation.image || null;
  return getMemberImage(getOtherMember(conversation, currentUserId));
}

/** ui-avatars breaks on unencoded spaces / Arabic names. */
export function avatarFallbackUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=00d0d4&color=fff`;
}

export function getInitials(name: string) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/** `messages` may arrive as an array or as a Laravel paginator. */
export function extractMessages(conversation?: Conversation | null): Message[] {
  if (!conversation) return [];
  const raw = conversation.messages;
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray((raw as { data: Message[] }).data)) {
    return (raw as { data: Message[] }).data;
  }
  return [];
}

/**
 * Newest message, for the sidebar preview. The list endpoint has no
 * `last_message` field — it returns the latest message inside `messages`.
 *
 * `clearedAt` is when this account last wiped the conversation (see
 * `./clearedChats`). Anything at or before that instant belongs to a chat the
 * account already deleted: the server hands the same id back when the chat is
 * restarted, and its old last line must not surface as the new one.
 */
export function getLastMessage(
  conversation?: Conversation | null,
  clearedAt?: string | null
): Message | undefined {
  const message = conversation?.last_message ?? extractMessages(conversation).at(-1);
  if (!message) return undefined;
  if (clearedAt && toTimestamp(message.created_at) <= toTimestamp(clearedAt)) return undefined;
  return message;
}

/** Newest-activity timestamp, used for both the preview time and sorting. */
export function getLastActivityAt(
  conversation?: Conversation | null,
  clearedAt?: string | null
): string | undefined {
  const stamp =
    conversation?.messages_max_created_at ??
    getLastMessage(conversation, clearedAt)?.created_at ??
    conversation?.last_message_at ??
    conversation?.updated_at;

  // `updated_at` moves for reasons that are not messages, so the guard has to
  // sit on the result rather than on the branch that produced it.
  if (clearedAt && toTimestamp(stamp) <= toTimestamp(clearedAt)) return undefined;
  return stamp;
}

/**
 * The API mixes two timestamp formats: ISO-with-zone (`2026-08-01T13:36:08.000000Z`)
 * on model fields, and space-separated UTC without a zone marker
 * (`2026-08-01 10:32:20`) on `messages_max_created_at`. Comparing those as raw
 * strings is unreliable, and `new Date("… …")` reads the second form as local
 * time, shifting it by the UTC offset. Normalise before doing either.
 */
export function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  let normalized = String(value).trim();
  if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
  if (!/([Zz]|[+-]\d{2}:?\d{2})$/.test(normalized)) normalized += "Z";
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}

export function getMessageText(message: Message): string {
  return message.message ?? message.body ?? "";
}

export function getMessageSenderId(message: Message) {
  return message.user_id ?? message.sender_id ?? message.user?.id ?? message.sender?.id;
}

export function getMessageSender(message: Message): ConversationUser | undefined {
  return message.sender ?? message.user;
}

/** Normalises every attachment shape the API has used into `{ url, name }`. */
/**
 * Turns whatever the API stored into something an `<img>` or a download link
 * can use.
 *
 * Attachments come back as `{ file_name, file_path, mime_type }`, where
 * `file_path` is storage-relative (`messages/ab12….png`) — so it has to be
 * resolved against the files host (which follows the API failover). `url`,
 * `path` and `name` are only read as a fallback for legacy payloads.
 */
function resolveAttachmentUrl(raw: string): string {
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  return `${getFilesBaseUrl().replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;
}

export function getMessageAttachments(message: Message) {
  const raw = [
    ...(Array.isArray(message.attachments) ? message.attachments : []),
    ...(Array.isArray(message.files) ? message.files : []),
  ];
  if (raw.length === 0 && message.attachment) {
    raw.push(
      typeof message.attachment === "string"
        ? { url: message.attachment }
        : message.attachment
    );
  }
  return raw
    .map((a) => {
      const source = a?.file_path || a?.url || a?.path || "";
      if (!source) return null;
      const url = resolveAttachmentUrl(source);
      const name = a?.file_name || a?.name || source.split("/").pop() || "file";
      const isImage =
        (a?.mime_type ?? "").startsWith("image/") ||
        /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name || source);
      return { url, name, isImage };
    })
    .filter(Boolean) as { url: string; name: string; isImage: boolean }[];
}

/** Sender ids collide across entity types, so selection keys must be namespaced. */
export function makeParticipantKey(kind: string, id: number | string) {
  return `${kind}:${id}`;
}

export function parseParticipantKey(key: string) {
  const [kind, ...rest] = key.split(":");
  return { kind, id: rest.join(":") };
}
