import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "../api/conversations.api";
import type {
  Conversation,
  ConversationsListResult,
  ConversationsQueryParams,
  CreateConversationPayload,
  Message,
  UpdateConversationPayload,
} from "../types/conversations.types";
import { extractMessages } from "../utils/conversation.helpers";

/** There is no websocket layer in this app, so the chat is kept fresh by polling. */
const LIST_POLL_MS = 20_000;
const THREAD_POLL_MS = 7_000;

export const conversationKeys = {
  all: (role: string) => ["conversations", role] as const,
  list: (role: string, params?: ConversationsQueryParams) =>
    ["conversations", role, params ?? {}] as const,
  detail: (role: string, id: number | string | null) =>
    ["conversation", role, id] as const,
};

export function useConversations(role: string, params?: ConversationsQueryParams) {
  const queryClient = useQueryClient();

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: conversationKeys.all(role) });

  const invalidateBoth = (id: number | string) => {
    queryClient.invalidateQueries({ queryKey: conversationKeys.detail(role, id) });
    return invalidateAll();
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: conversationKeys.list(role, params),
    queryFn: () => conversationsApi.getAll(role, params),
    refetchInterval: LIST_POLL_MS,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateConversationPayload) =>
      conversationsApi.create(role, payload),
    onSuccess: (created) => {
      // Insert into every cached list immediately so the new conversation is
      // visible before the refetch lands. The server de-duplicates 1-on-1
      // chats, so a "created" conversation may already be in the list.
      if (created?.id) {
        queryClient.setQueriesData<ConversationsListResult>(
          { queryKey: conversationKeys.all(role) },
          (old) => {
            if (!old?.data) return old;
            if (old.data.some((c) => String(c.id) === String(created.id))) return old;
            return {
              ...old,
              data: [created, ...old.data],
              meta: { ...old.meta, total: (old.meta?.total ?? old.data.length) + 1 },
            };
          }
        );
      }
      return invalidateAll();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateConversationPayload }) =>
      conversationsApi.update(role, id, data),
    onSuccess: (_, variables) => invalidateBoth(variables.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => conversationsApi.delete(role, id),
    onSuccess: invalidateAll,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      id,
      message,
      files,
    }: {
      id: number | string;
      message: string;
      files?: File[];
      /** Passed through so the optimistic entry can be rendered as "mine". */
      currentUser?: { id: number | string; name?: string; image?: string | null };
    }) => conversationsApi.sendMessage(role, id, { message, files }),

    // Show the message immediately; the poll/invalidate replaces it with the
    // server copy.
    onMutate: async (variables) => {
      const key = conversationKeys.detail(role, variables.id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Conversation>(key);

      if (previous) {
        const optimisticAttachments = variables.files?.map((file) => ({
          id: `optimistic-file-${Date.now()}-${file.name}`,
          url: URL.createObjectURL(file),
          name: file.name,
          mime_type: file.type,
          size: file.size,
        })) || [];

        const optimistic: Message = {
          id: `optimistic-${Date.now()}`,
          conversation_id: variables.id,
          user_id: variables.currentUser?.id,
          message: variables.message,
          created_at: new Date().toISOString(),
          attachments: optimisticAttachments,
          user: variables.currentUser
            ? {
                id: variables.currentUser.id,
                name: variables.currentUser.name,
                image: variables.currentUser.image ?? null,
              }
            : undefined,
          _optimistic: true,
        };
        queryClient.setQueryData<Conversation>(key, {
          ...previous,
          messages: [...extractMessages(previous), optimistic],
        });
      }

      return { previous, key };
    },

    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _err, variables) => invalidateBoth(variables.id),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number | string) => conversationsApi.markAsRead(role, id),
    onSuccess: invalidateAll,
  });

  const addMemberMutation = useMutation({
    mutationFn: ({
      id,
      user_id,
      memberRole,
    }: {
      id: number | string;
      user_id: number | string;
      memberRole?: string;
    }) => conversationsApi.addMember(role, id, { user_id, role: memberRole }),
    onSuccess: (_, variables) => invalidateBoth(variables.id),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number | string; userId: number | string }) =>
      conversationsApi.removeMember(role, id, userId),
    onSuccess: (_, variables) => invalidateBoth(variables.id),
  });

  const changeMemberRoleMutation = useMutation({
    mutationFn: ({
      id,
      userId,
      memberRole,
    }: {
      id: number | string;
      userId: number | string;
      memberRole: string;
    }) => conversationsApi.changeMemberRole(role, id, userId, { role: memberRole }),
    onSuccess: (_, variables) => invalidateBoth(variables.id),
  });

  return {
    conversations: data?.data ?? [],
    meta: data?.meta,
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,

    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateConversation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteConversation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    changeMemberRole: changeMemberRoleMutation.mutateAsync,
    isChangingMemberRole: changeMemberRoleMutation.isPending,
  };
}

export function useConversation(role: string, id: number | string | null) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: conversationKeys.detail(role, id),
    queryFn: () => conversationsApi.getOne(role, id as number | string),
    enabled: id !== null && id !== undefined && id !== "",
    refetchInterval: THREAD_POLL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    conversation: data ?? null,
    messages: extractMessages(data),
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
