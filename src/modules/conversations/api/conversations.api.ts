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

  update: async (role: string, id: number | string, data: any) => {
    // If it's a FormData object, or contains an image file, use FormData with POST _method=PUT
    if (data instanceof FormData) {
      data.append("_method", "PUT");
      const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}`, data);
      return (response as any).data;
    } else if (data.image instanceof File) {
      const formData = new FormData();
      if (data.title) formData.append("title", data.title);
      formData.append("image", data.image);
      formData.append("_method", "PUT");
      const response = await apiClient.post(`${getRolePrefix(role)}/conversations/${id}`, formData);
      return (response as any).data;
    }
    
    const response = await apiClient.put(`${getRolePrefix(role)}/conversations/${id}`, data);
    return (response as any).data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/conversations/${id}`);
    return (response as any).data;
  },

  sendMessage: async (role: string, id: number | string, data: { body?: string; message?: string; attachment?: File | null; files?: File[] }) => {
    const formData = new FormData();
    // Support both old 'body' and new 'message' keys
    formData.append("message", data.message || data.body || "");
    // If backend requires old 'body', we can append it as well, but let's stick to message for the new API
    if (data.body) formData.append("body", data.body);
    
    formData.append("type", "text");
    
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files[]", file);
      });
    } else if (data.attachment) {
      formData.append("files[]", data.attachment);
      formData.append("attachment", data.attachment); // fallback for old api
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
