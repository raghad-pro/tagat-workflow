import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Conversation,
  ConversationsListResult,
  ConversationsQueryParams,
  CreateConversationPayload,
  SendMessagePayload,
  UpdateConversationPayload,
} from "../types/conversations.types";

/**
 * Route contract verified against the live API (`Allow` headers on
 * `/{role}/conversations/...`). Note the two PUT-only routes — sending POST
 * there returns 405.
 *
 *   GET|POST      /{role}/conversations
 *   GET|PUT|DELETE /{role}/conversations/{id}
 *   POST          /{role}/conversations/{id}/messages
 *   POST          /{role}/conversations/{id}/read
 *   POST          /{role}/conversations/{id}/members
 *   DELETE        /{role}/conversations/{id}/members/{userId}
 *   PUT           /{role}/conversations/{id}/members/{userId}/role
 */
const base = (role: string) => `${getRolePrefix(role)}/conversations`;

/**
 * `apiClient` already returns `response.data` (the response *body*), so the body
 * must be unwrapped exactly once here — unwrapping twice is what forced the
 * guess-the-shape fallback chains that used to live in the components.
 */
function unwrapOne<T>(body: unknown): T {
  const b = body as Record<string, unknown> | null;
  if (b && typeof b === "object" && !Array.isArray(b) && "data" in b) {
    const inner = b.data as Record<string, unknown> | null;
    if (inner && typeof inner === "object" && !Array.isArray(inner) && "data" in inner) {
      return inner.data as T;
    }
    return inner as T;
  }
  return body as T;
}

/**
 * `GET /conversations/{id}` does not return the conversation directly — it wraps
 * it as `{ data: { conversation, receiver } }`. Reading `data.messages` therefore
 * always came back empty, which is why every thread rendered with no messages.
 * `receiver` (the other participant of a 1-on-1 chat) is flattened onto the
 * conversation because that is where the title and avatar come from.
 */
function unwrapConversation(body: unknown): Conversation {
  const payload = unwrapOne<Record<string, any>>(body);
  if (payload && typeof payload === "object" && "conversation" in payload) {
    const { conversation, receiver } = payload;
    return { ...(conversation as Conversation), receiver: receiver ?? null };
  }
  return payload as Conversation;
}

function unwrapList(body: unknown): ConversationsListResult {
  if (Array.isArray(body)) {
    return { data: body as Conversation[], meta: { total: body.length } };
  }

  const b = (body ?? {}) as Record<string, any>;
  const first = b.data;

  if (Array.isArray(first)) {
    return {
      data: first as Conversation[],
      meta: b.meta ?? {
        total: b.total ?? first.length,
        current_page: b.current_page,
        last_page: b.last_page,
        per_page: b.per_page,
      },
    };
  }

  // Laravel paginator nested one level deeper: { data: { data: [...], total } }
  if (Array.isArray(first?.data)) {
    return {
      data: first.data as Conversation[],
      meta: first.meta ?? {
        total: first.total ?? first.data.length,
        current_page: first.current_page,
        last_page: first.last_page,
        per_page: first.per_page,
      },
    };
  }

  return { data: [], meta: { total: 0 } };
}

export const conversationsApi = {
  /**
   * `apiClient.get(url, params)` already wraps its second argument in axios'
   * `{ params }` — passing `{ params }` here serialised to `?params[search]=…`
   * and the backend never saw the filters.
   */
  getAll: async (
    role: string,
    params?: ConversationsQueryParams
  ): Promise<ConversationsListResult> => {
    const body = await apiClient.get(base(role), params as Record<string, unknown>);
    return unwrapList(body);
  },

  getOne: async (role: string, id: number | string): Promise<Conversation> => {
    const body = await apiClient.get(`${base(role)}/${id}`);
    return unwrapConversation(body);
  },

  create: async (
    role: string,
    data: CreateConversationPayload
  ): Promise<Conversation> => {
    const body = await apiClient.post(base(role), data);
    return unwrapConversation(body);
  },

  /**
   * The route only accepts PUT, so the usual `POST + _method=PUT` multipart
   * trick 405s. Title updates go over PUT/JSON; an image is attempted with the
   * spoofed POST and, when the backend rejects it, the caller is told that the
   * title was saved but the picture was not.
   */
  update: async (
    role: string,
    id: number | string,
    data: UpdateConversationPayload
  ): Promise<{ conversation: Conversation; imageRejected: boolean }> => {
    const url = `${base(role)}/${id}`;

    if (data.image instanceof File) {
      const formData = new FormData();
      if (data.title) formData.append("title", data.title);
      formData.append("image", data.image);
      formData.append("_method", "PUT");
      try {
        const body = await apiClient.post(url, formData);
        return { conversation: unwrapConversation(body), imageRejected: false };
      } catch (error: any) {
        if (error?.response?.status !== 405) throw error;
        // Backend has no POST route for this resource — save what we can.
        const body = await apiClient.put(url, { title: data.title });
        return { conversation: unwrapConversation(body), imageRejected: true };
      }
    }

    const body = await apiClient.put(url, { title: data.title });
    return { conversation: unwrapConversation(body), imageRejected: false };
  },

  delete: async (role: string, id: number | string) => {
    return apiClient.delete(`${base(role)}/${id}`);
  },

  /**
   * Sends `message` + `files[]` only. The previous version also appended the
   * legacy `body` and `attachment` keys alongside them, which duplicates the
   * payload and trips strict validators.
   */
  sendMessage: async (
    role: string,
    id: number | string,
    data: SendMessagePayload
  ) => {
    const formData = new FormData();
    formData.append("message", data.message ?? "");

    const files = data.files ?? [];
    formData.append("type", files.length > 0 ? "file" : "text");
    files.forEach((file) => formData.append("files[]", file));

    const body = await apiClient.post(`${base(role)}/${id}/messages`, formData);
    return unwrapOne(body);
  },

  markAsRead: async (role: string, id: number | string) => {
    return apiClient.post(`${base(role)}/${id}/read`);
  },

  addMember: async (
    role: string,
    id: number | string,
    data: { user_id: number | string; role?: string }
  ) => {
    const body = await apiClient.post(`${base(role)}/${id}/members`, data);
    return unwrapOne(body);
  },

  /** PUT — the server rejects POST on this route with 405. */
  changeMemberRole: async (
    role: string,
    id: number | string,
    userId: number | string,
    data: { role: string }
  ) => {
    const body = await apiClient.put(`${base(role)}/${id}/members/${userId}/role`, data);
    return unwrapOne(body);
  },

  removeMember: async (
    role: string,
    id: number | string,
    userId: number | string
  ) => {
    return apiClient.delete(`${base(role)}/${id}/members/${userId}`);
  },
};
