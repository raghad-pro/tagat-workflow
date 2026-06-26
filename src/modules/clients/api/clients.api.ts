import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  ApiClientsResponse,
  ApiClient,
  ClientsQueryParams,
  AddClientRequest,
  UpdateClientStatusRequest,
  DeleteClientRequest,
} from "../types/clients.types";

export const clientApi = {
  getAll: (params?: ClientsQueryParams, role = "super_admin") =>
    apiClient.get<ApiClientsResponse>(
      `${getRolePrefix(role)}/clients`,
      params as Record<string, unknown>
    ),

  create: (data: AddClientRequest, role = "super_admin") =>
    apiClient.post<{ success: boolean; message: string; data: ApiClient }>(
      `${getRolePrefix(role)}/clients`,
      role === "company_admin"
        ? { name: data.name, email: data.email, password: data.password }
        : data
    ),

  updateStatus: (id: number, data: UpdateClientStatusRequest, role = "super_admin") =>
    apiClient.put<{ success: boolean; message: string; data: unknown }>(
      `${getRolePrefix(role)}/clients/${id}`,
      role === "company_admin" ? { status: data.status } : data
    ),

  delete: (id: number, data: DeleteClientRequest, role = "super_admin") =>
    apiClient.delete<{ success: boolean; message: string }>(
      `${getRolePrefix(role)}/clients/${id}`,
      data
    ),
};