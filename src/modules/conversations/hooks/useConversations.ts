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
    mutationFn: ({ id, body, message, attachment, files }: { id: number | string; body?: string; message?: string; attachment?: File | null; files?: File[] }) =>
      conversationsApi.sendMessage(role, id, { body, message, attachment, files }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", role, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, user_id }: { id: number | string; user_id: number | string }) =>
      conversationsApi.addMember(role, id, { user_id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", role, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number | string; userId: number | string }) =>
      conversationsApi.removeMember(role, id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", role, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", role] });
    },
  });

  const changeMemberRoleMutation = useMutation({
    mutationFn: ({ id, userId, memberRole }: { id: number | string; userId: number | string; memberRole: string }) =>
      conversationsApi.changeMemberRole(role, id, userId, { role: memberRole }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", role, variables.id] });
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
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    changeMemberRole: changeMemberRoleMutation.mutateAsync,
    isChangingMemberRole: changeMemberRoleMutation.isPending,
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
