import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  ApiDevelopmentsResponse,
  ApiDevelopmentResponse,
  CreateDevelopmentRequest,
  UpdateDevelopmentRequest,
  DevelopmentsQueryParams,
} from "../types/developments.types";

const BASE = (role = "super_admin") => `${getRolePrefix(role)}/developments`;

export const developmentApi = {
  // GET /api/v1/super_admin/developments?page=1&per_page=10
  getAll: (params?: DevelopmentsQueryParams, role = "super_admin") =>
    apiClient.get<ApiDevelopmentsResponse>(BASE(role), params as Record<string, unknown>),

  // GET /api/v1/super_admin/developments/:id
  getById: (id: number, role = "super_admin") =>
    apiClient.get<ApiDevelopmentResponse>(`${BASE(role)}/${id}`),

  // POST /api/v1/super_admin/developments
  create: (data: CreateDevelopmentRequest, role = "super_admin") =>
    apiClient.post<ApiDevelopmentResponse>(BASE(role), data),

  // PUT /api/v1/super_admin/developments/:id
  update: (id: number, data: UpdateDevelopmentRequest, role = "super_admin") =>
    apiClient.put<ApiDevelopmentResponse>(`${BASE(role)}/${id}`, data),

  // DELETE /api/v1/super_admin/developments/:id
  delete: (id: number, role = "super_admin") =>
    apiClient.delete<{ success: boolean; message: string }>(`${BASE(role)}/${id}`),
};