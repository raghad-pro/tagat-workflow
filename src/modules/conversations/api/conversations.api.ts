import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Conversation, ConversationsQueryParams } from "../types/conversations.types";

export const conversationsApi = {
  getAll: async (role: string, params?: ConversationsQueryParams) => {
    const response = await apiClient.get(
      `${getRolePrefix(role)}/conversations`,
      { params }
    );
    const payload = (response as any).data;

    if (Array.isArray(payload)) {
      return { data: payload, meta: { total: payload.length } };
    }

    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: payload?.data?.length || payload?.total || 0 },
    };
  },

  getOne: async (role: string, id: number | string) => {
    const response = await apiClient.get(`${getRolePrefix(role)}/conversations/${id}`);
    return (response as any).data;
  },

  create: async (role: string, data: Partial<Conversation>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/conversations`, data);
    return (response as any).data;
  },

  update: async (role: string, id: number | string, data: Partial<Conversation>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/conversations/${id}`, data);
    return (response as any).data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/conversations/${id}`);
    return (response as any).data;
  },

  sendMessage: async (role: string, id: number | string, data: { body: string; attachment?: File | null }) => {
    const formData = new FormData();
    formData.append("body", data.body);
    if (data.attachment) {
      formData.append("attachment", data.attachment);
    }
    const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}/messages`, formData);
    return (response as any).data;
  },

  markAsRead: async (role: string, id: number | string) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}/read`);
    return (response as any).data;
  },

  addMember: async (role: string, id: number | string, data: { user_id: number | string; role?: string }) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}/members`, data);
    return (response as any).data;
  },

  changeMemberRole: async (role: string, id: number | string, userId: number | string, data: { role: string }) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}/members/${userId}/role`, data);
    return (response as any).data;
  },

  removeMember: async (role: string, id: number | string, userId: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/conversations/${id}/members/${userId}`);
    return (response as any).data;
  }
};
