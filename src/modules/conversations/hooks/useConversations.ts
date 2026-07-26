import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "../api/conversations.api";
import type { Conversation, ConversationsQueryParams } from "../types/conversations.types";

export function useConversations(role: string, params?: ConversationsQueryParams) {
  const queryClient = useQueryClient();
  const queryKey = ["conversations", role, params];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => conversationsApi.getAll(role, params),
  });

  const createMutation = useMutation({
    mutationFn: (newConversation: Partial<Conversation>) =>
      conversationsApi.create(role, newConversation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Conversation> }) =>
      conversationsApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => conversationsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, body, attachment }: { id: number | string; body: string; attachment?: File | null }) =>
      conversationsApi.sendMessage(role, id, { body, attachment }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", role, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  return {
    data,
    isLoading,
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
  };
}

export function useConversation(role: string, id: number | string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["conversation", role, id];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => conversationsApi.getOne(role, id!),
    enabled: !!id,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
